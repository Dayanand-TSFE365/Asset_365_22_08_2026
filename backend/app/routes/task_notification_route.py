from typing import List

from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.orm import Session

from app.db.database import get_task_db

from app.core.dependencies import get_current_user

from app.schemas.task_notification_schema import (
    TaskNotificationResponse,
)

from app.services.task.notification_service import (
    get_notifications_service,
    get_unread_count_service,
    mark_notification_read_service,
    mark_all_notifications_read_service,
)

router = APIRouter(
    prefix="/apiV3/tasks/notifications",
    tags=["Task Notifications"],
)


@router.get(
    "/",
    response_model=List[TaskNotificationResponse],
)
def get_notifications(
    db: Session = Depends(get_task_db),
    current_user=Depends(get_current_user),
):
    data = get_notifications_service(
        db,
        current_user.id,
    )  
    return data


@router.get(
    "/unread-count",
)
def unread_count(
    db: Session = Depends(get_task_db),
    current_user=Depends(get_current_user),
):
    return get_unread_count_service(
        db,
        current_user.id,
    )


@router.patch(
    "/{notification_id}/read",
)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_task_db),
    current_user=Depends(get_current_user),
):
    return mark_notification_read_service(
        db,
        notification_id,
        current_user.id,
    )


@router.patch(
    "/read-all",
)
def mark_all_read(
    db: Session = Depends(get_task_db),
    current_user=Depends(get_current_user),
):
    return mark_all_notifications_read_service(
        db,
        current_user.id,
    )