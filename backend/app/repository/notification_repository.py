from datetime import datetime

from sqlalchemy.orm import Session

from app.models.task_notification_model import TaskNotification


# ==========================================================
# Create Notification
# ==========================================================

def create_notification(
    db: Session,
    notification: TaskNotification,
):
    db.add(notification)
    db.flush()
    db.refresh(notification)
    return notification


# ==========================================================
# Get Notification By Id
# ==========================================================

def get_notification_by_id(
    db: Session,
    notification_id: int,
):
    return (
        db.query(TaskNotification)
        .filter(
            TaskNotification.id == notification_id
        )
        .first()
    )


# ==========================================================
# Get User Notifications
# ==========================================================

def get_notifications_by_user(
    db: Session,
    user_id: int,
):
    return (
        db.query(TaskNotification)
        .filter(
            TaskNotification.user_id == user_id
        )
        .order_by(
            TaskNotification.created_at.desc()
        )
        .all()
    )




# ==========================================================
# Get Unread Count
# ==========================================================

def get_unread_count(
    db: Session,
    user_id: int,
):
    return (
        db.query(TaskNotification)
        .filter(
            TaskNotification.user_id == user_id,
            TaskNotification.is_read == False,
        )
        .count()
    )


# ==========================================================
# Mark One As Read
# ==========================================================

def mark_notification_read(
    db: Session,
    notification: TaskNotification,
):
    notification.is_read = True
    notification.read_at = datetime.utcnow()

    db.add(notification)
    db.flush()
    db.refresh(notification)

    return notification


# ==========================================================
# Mark All As Read
# ==========================================================

def mark_all_notifications_read(
    db: Session,
    user_id: int,
):
    notifications = (
        db.query(TaskNotification)
        .filter(
            TaskNotification.user_id == user_id,
            TaskNotification.is_read == False,
        )
        .all()
    )

    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()

    db.flush()

    return notifications