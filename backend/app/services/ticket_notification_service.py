from sqlalchemy.orm import Session

from app.models.ticket_notification_model import (
    TicketNotification
)

from app.repository.ticket_notification_repo import (
    create_ticket_notification_repo
)

from app.websocket.connection_manager import (
    broadcast_user_notification
)


def create_ticket_notification_service(
    db: Session,
    ticket_id: int,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    created_by: int
):

    notification = TicketNotification(

        ticket_id=ticket_id,

        user_id=user_id,

        notification_type=notification_type,

        title=title,

        message=message,

        created_by=created_by
    )

    notification = (
        create_ticket_notification_repo(
            db,
            notification
        )
    )

    return notification



async def push_ticket_notification(
    notification: TicketNotification
):

    await broadcast_user_notification(

        user_id=notification.user_id,

        payload={
            "type": "notification",

            "notification_id": (
                notification.id
            ),

            "ticket_id": (
                notification.ticket_id
            ),

            "notification_type": (
                notification.notification_type
            ),

            "title": (
                notification.title
            ),

            "message": (
                notification.message
            ),

            "created_by": (
                notification.created_by
            ),

            "created_at": (
                notification.created_at.isoformat()
                if notification.created_at
                else None
            ),

            "is_read": (
                notification.is_read
            )
        }
    )