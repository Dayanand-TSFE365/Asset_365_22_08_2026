from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.services.task.notification_helper import (
    notify_user,
    push_notification,
    get_notification_receiver,
)
from app.models.task_status_history_model import TaskStatusHistory

from app.schemas.task_status_history_schema import (
    TaskStatusUpdate,
)
from app.services.activity_log_service import log_activity
from app.repository.task_repository import (
    get_task_by_id,
    update_task,
    create_task_status_history,
    get_task_status_history,

)

async def change_task_status_service(
    task_db: Session,
    asset_db: Session,
    task_id: int,
    status_data: TaskStatusUpdate,
    changed_by: int,
):
    try:

        task = get_task_by_id(
            task_db,
            task_id,
        )

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found."
            )

        if task.status == status_data.status:
            raise HTTPException(
                status_code=400,
                detail="Task already has this status."
            )
        old_status = task.status
        new_status = status_data.status

        history = TaskStatusHistory(
            task_id=task.id,
            old_status=task.status,
            new_status=status_data.status,
            remarks=status_data.remarks,
            changed_by=changed_by,
        )

        create_task_status_history(
            task_db,
            history,
        )

        task.status = status_data.status

        update_task(
            task_db,
            task,
        )

         # ACTIVITY LOG
        # IMPORTANT:
        # activity_logs is in Asset365 DB
        # -----------------------------------------

        log_activity(
            db=asset_db,
            created_by=changed_by,
            module="TASK",
            action="STATUS_CHANGE",
            item_type="TASK",
            item_id=task.id,
            item_name=task.title,
            notes=(
                f"Changed status of task '{task.title}' "
                f"from '{old_status}' to '{new_status}'."
            ),
            changes={
                "old_status": old_status,
                "new_status": new_status,
                "remarks": status_data.remarks,
            }
        )

        # -----------------------------------------
        # Notification
        # -----------------------------------------
        notification = None

        receiver = get_notification_receiver(
            task,
            changed_by,
        )

        if receiver:

            notification = notify_user(
                db=task_db,
                task_id=task.id,
                user_id=receiver,
                notification_type="status",
                title="Task Status Updated",
                message=f"Task '{task.title}' status changed from '{history.old_status}' to '{history.new_status}'.",
                created_by=changed_by,
            )
        task_db.commit()
        if notification:
            await push_notification(notification)

        return {
            "message": "Task status updated successfully."
        }

    except HTTPException:
        task_db.rollback()
        raise

    except Exception as e:

        task_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to update task status: {str(e)}",
        )


def get_task_status_history_service(
    db: Session,
    task_id: int,
):
    try:

        task = get_task_by_id(
            db,
            task_id,
        )

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found."
            )

        return get_task_status_history(
            db,
            task_id,
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch task status history: {str(e)}",
        )