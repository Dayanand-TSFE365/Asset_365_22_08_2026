from sqlalchemy.orm import Session
from fastapi import HTTPException
import logging


from app.repository.master_repo import (
    get_employee_by_auth_user_id,
)
from app.services.task.notification_helper import (
    notify_user,
    push_notification,
)

from app.celery_task.task_email_tasks import (
    send_new_task_assignment_email_task,
    send_task_reassigned_email_task,
)

from app.services.activity_log_service import log_activity
from app.models.task_assignment_history_model import TaskAssignmentHistory
from app.schemas.task_schema import TaskAssign

from app.repository.task_repository import (
    get_task_by_id,
    update_task,
    create_assignment_history,
)

logger = logging.getLogger("celery_app")


async def assign_task_service(
    task_db: Session,
    asset_db: Session,
    task_id: int,
    assign_data: TaskAssign,
    assigned_by: int,
):
    try:

        task = get_task_by_id(task_db, task_id)

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found."
            )

        if task.assigned_to == assign_data.assigned_to:
            raise HTTPException(
                status_code=400,
                detail="Task is already assigned to this user."
            )
        

        old_assignee = task.assigned_to
        old_employee = get_employee_by_auth_user_id(
            asset_db,
            old_assignee,
        )

        new_employee = get_employee_by_auth_user_id(
            asset_db,
            assign_data.assigned_to,
        )

        manager = get_employee_by_auth_user_id(
            asset_db,
            assigned_by,
        )

        # -----------------------------------------
        # Update Assignee
        # -----------------------------------------
        if not new_employee:
            raise HTTPException(
                status_code=404,
                detail="Assigned employee not found."
            )

        if not new_employee.department:
            raise HTTPException(
                status_code=400,
                detail="Assigned employee has no department."
            )



        task.assigned_to = assign_data.assigned_to
        task.department = new_employee.department


        # Save task (if using repository pattern)
        update_task(
            task_db,
            task,
        )

        # -----------------------------------------
        # Assignment History
        # -----------------------------------------

        history = TaskAssignmentHistory(
            task_id=task.id,
            old_assignee=old_assignee,
            new_assignee=assign_data.assigned_to,
            assigned_by=assigned_by,
            note=assign_data.note or "Task Reassigned",
            reason=assign_data.reason,
        )
    

        create_assignment_history(
            task_db,
            history,
        )

        # -----------------------------------------
        # ACTIVITY LOG
        # -----------------------------------------

        log_activity(
            db=asset_db,
            created_by=assigned_by,
            module="TASK",
            action="REASSIGN",
            item_type="TASK",
            item_id=task.id,
            item_name=task.title,
            target_user_id=assign_data.assigned_to,
            notes=(
                f"Task '{task.title}' reassigned "
                f"from "
                f"'{old_employee.full_name if old_employee else old_assignee}' "
                f"to '{new_employee.full_name}'."
                + (
                    f" Reason: {assign_data.reason}."
                    if assign_data.reason
                    else ""
                )
            ),
            changes={
                "old_assignee": old_assignee,
                "new_assignee": assign_data.assigned_to,
                "old_assignee_name": (
                    old_employee.full_name
                    if old_employee
                    else None
                ),
                "new_assignee_name": new_employee.full_name,
                "department": new_employee.department,
                "reason": assign_data.reason,
                "note": assign_data.note
            }
        )

        # -----------------------------------------
        # Notifications
        # -----------------------------------------

        old_notification = None
        new_notification = None

        # Notify old assignee
        if old_assignee:

            old_notification = notify_user(
                db=task_db,
                task_id=task.id,
                user_id=old_assignee,
                notification_type="reassignment",
                title="Task Reassigned",
                message=f"Task '{task.title}' has been reassigned to {new_employee.full_name}.",
                created_by=assigned_by,
            )

        # Notify new assignee
        new_notification = notify_user(
            db=task_db,
            task_id=task.id,
            user_id=assign_data.assigned_to,
            notification_type="assignment",
            title="New Task Assigned",
            message=f"You have been assigned the task '{task.title}'.",
            created_by=assigned_by,
        )

        task_db.commit()
        if old_notification:
            await push_notification(old_notification)

        if new_notification:
            await push_notification(new_notification)
        try:

            if old_employee and old_employee.email:

                send_task_reassigned_email_task.delay(
                        email=old_employee.email,
                        employee_name=old_employee.full_name,
                        task_title=task.title,
                        new_assignee=new_employee.full_name,
                        reason=assign_data.reason or "-",
                    )
                logger.info(
                    "Reassignment email queued | "
                    "task_id=%s | old_assignee=%s | email=%s",
                    task.id,
                    old_assignee,
                    old_employee.email,
                )
            else:

                logger.warning(
                    "Reassignment email not queued | "
                    "task_id=%s | old employee/email unavailable",
                    task.id,
                )
                

            if new_employee and new_employee.email:

                send_new_task_assignment_email_task.delay(
                        email=new_employee.email,
                        employee_name=new_employee.full_name,
                        task_title=task.title,
                        assigned_by=manager.full_name if manager else "Manager",
                        reason=assign_data.reason or "-",
                        deadline=str(task.deadline) if task.deadline else "-",
                    )

                logger.info(
                    "New assignment email queued | "
                    "task_id=%s | new_assignee=%s | email=%s",
                    task.id,
                    assign_data.assigned_to,
                    new_employee.email,
                )
            else:

                logger.warning(
                    "Assignment email not queued | "
                    "task_id=%s | new employee/email unavailable",
                    task.id,
                )

        except Exception as e:

            logger.error(
                "Failed to queue task assignment email | "
                "task_id=%s | error=%s",
                task.id,
                str(e),
                exc_info=True,
            )

        return get_task_by_id(
            task_db,
            task.id,
        ) 

    except HTTPException:
        task_db.rollback()
        raise

    except Exception as e:
        task_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to assign task: {str(e)}",
        )