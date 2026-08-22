from sqlalchemy.orm import Session

from app.models.task_notification_model import TaskNotification

from app.repository.notification_repository import create_notification

from app.websocket.connection_manager import (
    broadcast_user_notification,
)


def notify_user(
    db: Session,
    task_id: int,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    created_by: int,
):
    notification = TaskNotification(
        task_id=task_id,
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        created_by=created_by,
    )

    create_notification(
        db,
        notification,
    )
  

    return notification

async def push_notification(notification: TaskNotification):
    await broadcast_user_notification(
        user_id=notification.user_id,
        payload={
            "type": "notification",
            "notification_id": notification.id,
            "task_id": notification.task_id,
            "notification_type": notification.notification_type,
            "title": notification.title,
            "message": notification.message,
            "created_by": notification.created_by,
        },
    )

def get_notification_receiver(
    task,
    actor_id: int,
):
    """
    Returns the user who should receive the notification.

    If the creator performs the action,
    notify the assignee.

    If the assignee performs the action,
    notify the creator.
    """

    if actor_id == task.created_by:
        return task.assigned_to

    if actor_id == task.assigned_to:
        return task.created_by

    return None


# def get_notification_receivers(
#     task
# ):
#     """
#     Returns all users who should receive
#     notifications for the task.
#     """

#     receivers = []

#     if task.created_by:
#         receivers.append(task.created_by)

#     if task.assigned_to:
#         receivers.append(task.assigned_to)

#     # Remove duplicates
#     return list(set(receivers))

def get_notification_receivers(
    task,
    actor_id: int
):
    receivers = []

    if task.created_by and task.created_by != actor_id:
        receivers.append(task.created_by)

    if task.assigned_to and task.assigned_to != actor_id:
        receivers.append(task.assigned_to)

    return list(set(receivers))