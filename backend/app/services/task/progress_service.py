from sqlalchemy.orm import Session
from fastapi import HTTPException


from app.models.task_progress_model import TaskProgress
from app.services.activity_log_service import log_activity
from app.schemas.task_progress_schema import TaskProgressCreate
from app.services.task.notification_helper import (
    notify_user,
    push_notification,
    get_notification_receiver,
    get_notification_receivers
)

from app.repository.task_repository import (
    get_task_by_id,
    get_task_progress_by_id,
    get_task_progress_history,
    create_task_progress,
)
from app.websocket.connection_manager import broadcast_task_event





async def create_task_progress_service(
    task_db: Session,
    asset_db: Session,
    task_id: int,
    progress_data: TaskProgressCreate,
    created_by: int,
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

        progress = TaskProgress(
            task_id=task.id,
            message=progress_data.message.strip(),
            hours_worked=progress_data.hours_worked,
            hours_remaining=progress_data.hours_remaining,
            progress=progress_data.progress,
            blockers=progress_data.blockers,
            created_by=created_by,
        )

        progress = create_task_progress(
            task_db,
            progress,
        )

        # ACTIVITY LOG
        # -----------------------------------------

        log_activity(
            db=asset_db,
            created_by=created_by,
            module="TASK",
            action="CREATE_PROGRESS",
            item_type="TASK_PROGRESS",
            item_id=progress.id,
            item_name=task.title,
            notes=(
                f"Added progress update for task "
                f"'{task.title}'. "
                f"Progress: {progress.progress}%. "
                f"Hours worked: {progress.hours_worked}. "
                f"Hours remaining: {progress.hours_remaining}."
                + (
                    f" Message: {progress.message}."
                    if progress.message
                    else ""
                )
                + (
                    f" Blockers: {progress.blockers}."
                    if progress.blockers
                    else ""
                )
            ),
            changes={
                "task_id": task.id,
                "progress_id": progress.id,
                "progress": progress.progress,
                "hours_worked": progress.hours_worked,
                "hours_remaining": progress.hours_remaining,
                "message": progress.message,
                "blockers": progress.blockers,
            }
        )

        # -----------------------------------------
        # Update Task Progress
        # -----------------------------------------

        task.progress = progress_data.progress

        # notification = None
        # # Notification
        # # -----------------------------------------
        # receiver = get_notification_receiver(
        #     task,
        #     created_by,
        # )

        # if receiver:
        #     notification = notify_user(
        #         db=task_db,
        #         task_id=task.id,
        #         user_id=receiver,
        #         notification_type="progress",
        #         title="Task Progress Updated",
        #         message=(
        #             f"Progress updated to {progress.progress}% "
        #             f"for task '{task.title}'."
        #             + (
        #                 f" Update: {progress.message}"
        #                 if progress.message
        #                 else ""
        #             )
        #         ),
        #         created_by=created_by,
        #     )

        # task_db.commit()
        # task_db.refresh(progress)

        # if notification:
        #     await push_notification(notification)

        receivers = get_notification_receivers(
            task,
            created_by
        )

        notifications = []

        for receiver in receivers:

            notification = notify_user(
                db=task_db,
                task_id=task.id,
                user_id=receiver,
                notification_type="progress",
                title="Task Progress Updated",
                message=(
                    f"Progress updated to {progress.progress}% "
                    f"for task '{task.title}'."
                ),
                created_by=created_by,
            )

            notifications.append(notification)

        task_db.commit()

        for notification in notifications:
            await push_notification(notification)

        # -----------------------------------------
        # Broadcast WebSocket Event
        # -----------------------------------------

        await broadcast_task_event(
                task.id,
                {
                    "type": "progress_created",
                    "task_id": task.id,
                    "progress_id": progress.id,
                    "progress": progress.progress,
                    "message": progress.message,
                    "created_by": created_by,
                }
            )
        

        return get_task_progress_by_id(
            task_db,
            progress.id,
        )

    except HTTPException:
        task_db.rollback()
        raise

    except Exception as e:

        task_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to create task progress: {str(e)}",
        )


def get_task_progress_service(
    db: Session,
    progress_id: int,
):
    try:

        progress = get_task_progress_by_id(
            db,
            progress_id,
        )

        if not progress:
            raise HTTPException(
                status_code=404,
                detail="Progress not found."
            )

        return progress

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch progress: {str(e)}",
        )


def get_task_progress_history_service(
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

        return get_task_progress_history(
            db,
            task_id,
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch task progress history: {str(e)}",
        )