from sqlalchemy.orm import Session

from app.models.ticket_notification_model import (
    TicketNotification
)


def create_ticket_notification_repo(
    db: Session,
    notification: TicketNotification
):

    db.add(notification)

    db.commit()

    db.refresh(notification)

    return notification


def get_user_ticket_notifications_repo(
    db: Session,
    user_id: int
):

    return (
        db.query(TicketNotification)
        .filter(
            TicketNotification.user_id == user_id
        )
        .order_by(
            TicketNotification.created_at.desc()
        )
        .all()
    )


def get_unread_ticket_notifications_repo(
    db: Session,
    user_id: int
):

    return (
        db.query(TicketNotification)
        .filter(
            TicketNotification.user_id == user_id,
            TicketNotification.is_read == False
        )
        .order_by(
            TicketNotification.created_at.desc()
        )
        .all()
    )


def get_ticket_notification_by_id_repo(
    db: Session,
    notification_id: int,
    user_id: int
):

    return (
        db.query(TicketNotification)
        .filter(
            TicketNotification.id == notification_id,
            TicketNotification.user_id == user_id
        )
        .first()
    )


def mark_ticket_notification_read_repo(
    db: Session,
    notification: TicketNotification
):

    notification.is_read = True

    db.commit()

    db.refresh(notification)

    return notification


def mark_all_ticket_notifications_read_repo(
    db: Session,
    user_id: int
):

    notifications = (
        db.query(TicketNotification)
        .filter(
            TicketNotification.user_id == user_id,
            TicketNotification.is_read == False
        )
        .all()
    )

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return notifications