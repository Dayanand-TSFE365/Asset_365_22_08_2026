import asyncio

from app.celery_app import celery_app
import logging

from app.services.email.task_email_service import (
    send_new_task_assignment_email,
    send_task_reassigned_email
)

from app.services.email.task_approval_rejection_email_service import (
    send_task_approved_email,
    send_task_rejected_email
)

logger = logging.getLogger("celery_app")


@celery_app.task
def send_new_task_assignment_email_task(
    email: str,
    employee_name: str,
    task_title: str,
    assigned_by: str,
    reason: str,
    deadline: str = "-",
):

    logger.info(
        "Starting new task assignment email | "
        "recipient=%s | task=%s",
        email,
        task_title,
    )

    try:
        asyncio.run(
            send_new_task_assignment_email(
                email=email,
                employee_name=employee_name,
                task_title=task_title,
                assigned_by=assigned_by,
                reason=reason,
                deadline=deadline,
            )
        )
        logger.info(
            "New task assignment email sent successfully | "
            "recipient=%s | task=%s",
            email,
            task_title,
        )

    except Exception as e:

        logger.error(
            "New task assignment email failed | "
            "recipient=%s | task=%s | error=%s",
            email,
            task_title,
            str(e),
            exc_info=True,
        )

        raise

# ==========================================================
# TASK REASSIGNED EMAIL
# ==========================================================

@celery_app.task
def send_task_reassigned_email_task(
    email: str,
    employee_name: str,
    task_title: str,
    new_assignee: str,
    reason: str,
):

    logger.info(
        "Starting task reassignment email | "
        "recipient=%s | task=%s",
        email,
        task_title,
    )

    try:
        asyncio.run(
            send_task_reassigned_email(
                email=email,
                employee_name=employee_name,
                task_title=task_title,
                new_assignee=new_assignee,
                reason=reason,
            )
        )

        logger.info(
                "Task reassignment email sent successfully | "
                "recipient=%s | task=%s",
                email,
                task_title,
            )
    except Exception as e:

        logger.error(
            "Task reassignment email failed | "
            "recipient=%s | task=%s | error=%s",
            email,
            task_title,
            str(e),
            exc_info=True,
        )

        raise




@celery_app.task
def send_task_approved_email_task(
    email: str,
    employee_name: str,
    task_title: str,
    approved_by: str,
    comment: str | None = None,
):

    asyncio.run(
        send_task_approved_email(
            email=email,
            employee_name=employee_name,
            task_title=task_title,
            approved_by=approved_by,
            comment=comment,
        )
    )


@celery_app.task
def send_task_rejected_email_task(
    email: str,
    employee_name: str,
    task_title: str,
    approved_by: str,
    reason: str,
):

    asyncio.run(
        send_task_rejected_email(
            email=email,
            employee_name=employee_name,
            task_title=task_title,
            approved_by=approved_by,
            reason=reason,
        )
    )