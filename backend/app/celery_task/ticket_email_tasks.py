import asyncio

from app.celery_app import celery_app
import logging

from app.services.email.ticket_email_service import (
    send_new_ticket_assignment_email,
)


# CELERY LOGGER
# ============================================================

logger = logging.getLogger("celery_app")


@celery_app.task( 
    bind=True,
    name="send_new_ticket_assignment_email_task",
)
def send_new_ticket_assignment_email_task(
    self,
    email: str,
    employee_name: str,
    ticket_no: str,
    customer_name: str,
    scope_of_work: str,
    assigned_by: str,
    due_date: str,
):

    task_id = self.request.id

    logger.info(
        "[TICKET EMAIL] Celery task started "
        "| task_id=%s "
        "| ticket_no=%s "
        "| recipient=%s "
        "| employee=%s",
        task_id,
        ticket_no,
        email,
        employee_name,
    )

    try:
        logger.info(
            "[TICKET EMAIL] Sending email "
            "| task_id=%s "
            "| ticket_no=%s "
            "| recipient=%s",
            task_id,
            ticket_no,
            email,
        )
        asyncio.run(
            send_new_ticket_assignment_email(
                email=email,
                employee_name=employee_name,
                ticket_no=ticket_no,
                customer_name=customer_name,
                scope_of_work=scope_of_work,
                assigned_by=assigned_by,
                due_date=due_date,
            )
        )

        logger.info(
            "[TICKET EMAIL] Email sent successfully "
            "| task_id=%s "
            "| ticket_no=%s "
            "| recipient=%s",
            task_id,
            ticket_no,
            email,
        )

        return {
            "status": "success",
            "ticket_no": ticket_no,
            "email": email,
        }

    except Exception as e:
        logger.error(
            "[TICKET EMAIL] Email sending failed "
            "| task_id=%s "
            "| ticket_no=%s "
            "| recipient=%s "
            "| error=%s",
            task_id,
            ticket_no,
            email,
            str(e),
            exc_info=True,
        )

        raise