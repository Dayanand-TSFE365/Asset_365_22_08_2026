from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.task_approval_history_model import TaskApprovalHistory

from app.schemas.task_schema import TaskCloseSchema
import asyncio

from app.repository.master_repo import get_employee_by_auth_user_id
from app.services.task.notification_helper import (
    notify_user,
    push_notification,
)
from app.services.email.task_approval_rejection_email_service import (
    send_task_approved_email,
    send_task_rejected_email
)

from app.services.activity_log_service import log_activity

from app.repository.task_repository import (
    get_task_by_id,
    update_task
)

from app.repository.task_repository import (
    create_task_approval_history
)


def close_task_service(
    task_db: Session,
    asset_db: Session,
    task_id: int,
    close_data: TaskCloseSchema,
    approved_by: int,
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
        old_status = task.status
        assigned_employee = get_employee_by_auth_user_id(
            asset_db,
            task.assigned_to,
        )

        manager = get_employee_by_auth_user_id(
            asset_db,
            approved_by,
        )


        # --------------------------
        # Approve
        # --------------------------
        if close_data.decision == "approve":

            task.status = "Completed"

        # --------------------------
        # Reject
        # --------------------------
        elif close_data.decision == "reject":

            task.status = "In Progress"

        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid decision."
            )

        update_task(
            task_db,
            task,
        )

        history = TaskApprovalHistory(
            task_id=task.id,
            decision=close_data.decision,
            comment=close_data.comment,
            rating=close_data.rating,
            approved_by=approved_by,
        )

        create_task_approval_history(
            task_db,
            history,
        )

        # -----------------------------------------
        # ACTIVITY LOG
        # -----------------------------------------

        log_activity(
            db=task_db,
            created_by=approved_by,
            module="TASK",
            action=(
                "APPROVE"
                if close_data.decision == "approve"
                else "REJECT"
            ),
            item_type="TASK",
            item_id=task.id,
            item_name=task.title,
            target_user_id=task.assigned_to,
            notes=(
                f"Task '{task.title}' "
                f"{'approved' if close_data.decision == 'approve' else 'rejected'} "
                f"by {manager.full_name if manager else f'User ID {approved_by}'}. "
                + (
                    f"Comment: {close_data.comment}"
                    if close_data.comment
                    else ""
                )
            ),
            changes={
                "decision": close_data.decision,
                "old_status": old_status,
                "new_status": task.status,
                "comment": close_data.comment,
                "rating": close_data.rating,
                "approved_by": approved_by
            }
        )
        # -----------------------------------------
        # Notification
        # -----------------------------------------

        notification = None

        if close_data.decision == "approve":

            notification = notify_user(
                db=task_db,
                task_id=task.id,
                user_id=task.assigned_to,
                notification_type="approval",
                title="Task Approved",
                message=f"Your task '{task.title}' has been approved.",
                created_by=approved_by,
            )

        elif close_data.decision == "reject":

            notification = notify_user(
                db=task_db,
                task_id=task.id,
                user_id=task.assigned_to,
                notification_type="rejection",
                title="Task Returned",
                message=close_data.comment or "Your task has been returned for rework.",
                created_by=approved_by,
            )

        task_db.commit()

        task_db.refresh(task)
        if notification:
            push_notification(notification)

        try:

            if assigned_employee and assigned_employee.email:

                if close_data.decision == "approve":

                    asyncio.run(
                        send_task_approved_email(
                            email=assigned_employee.email,
                            employee_name=assigned_employee.full_name,
                            task_title=task.title,
                            approved_by=manager.full_name if manager else "Manager",
                            comment=close_data.comment,
                        )
                    )

                elif close_data.decision == "reject":

                    asyncio.run(
                        send_task_rejected_email(
                            email=assigned_employee.email,
                            employee_name=assigned_employee.full_name,
                            task_title=task.title,
                            approved_by=manager.full_name if manager else "Manager",
                            reason=close_data.comment or "-",
                        )
                    )

        except Exception as e:
            print("Task approval email failed:", e)

        return task

    except HTTPException:
        task_db.rollback()
        raise

    except Exception as e:
        task_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to close task: {str(e)}",
        )