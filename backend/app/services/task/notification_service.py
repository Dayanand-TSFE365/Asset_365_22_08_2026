from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repository.notification_repository import (
    get_notifications_by_user,
    get_notification_by_id,
    get_unread_count,
    mark_notification_read,
    mark_all_notifications_read,
)


def get_notifications_service(
    db: Session,
    user_id: int,
):
    try:

        return get_notifications_by_user(
            db,
            user_id,
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


def get_unread_count_service(
    db: Session,
    user_id: int,
):
    try:

        count = get_unread_count(
            db,
            user_id,
        )

        return {
            "count": count,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


def mark_notification_read_service(
    db: Session,
    notification_id: int,
    user_id: int,
):
    try:

        notification = get_notification_by_id(
            db,
            notification_id,
        )

        if not notification:
            raise HTTPException(
                status_code=404,
                detail="Notification not found."
            )

        if notification.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized."
            )

        mark_notification_read(
            db,
            notification,
        )

        db.commit()

        return {
            "message": "Notification marked as read."
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


def mark_all_notifications_read_service(
    db: Session,
    user_id: int,
):
    try:

        mark_all_notifications_read(
            db,
            user_id,
        )

        db.commit()

        return {
            "message": "All notifications marked as read."
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )