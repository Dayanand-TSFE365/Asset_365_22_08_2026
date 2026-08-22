
from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.db.database import (
    get_ticket_db
)

from app.core.dependencies import (
    get_current_user
)

from app.repository.ticket_notification_repo import (
    get_user_ticket_notifications_repo,
    get_unread_ticket_notifications_repo,
    get_ticket_notification_by_id_repo,
    mark_ticket_notification_read_repo,
    mark_all_ticket_notifications_read_repo
)

from app.schemas.ticket_notification_schema import (
    TicketNotificationResponse
)


router = APIRouter(
    prefix="/apiV3/ticket-notifications",
    tags=["Ticket Notifications"]
)


@router.get(
    "",
    response_model=list[TicketNotificationResponse]
)
def get_notifications(
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):

    return get_user_ticket_notifications_repo(
        db,
        current_user.id
    )


@router.get(
    "/unread",
    response_model=list[TicketNotificationResponse]
)
def get_unread_notifications(
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):

    return get_unread_ticket_notifications_repo(
        db,
        current_user.id
    )

@router.patch(
    "/{notification_id}/read",
    response_model=TicketNotificationResponse
)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):

    notification = (
        get_ticket_notification_by_id_repo(
            db,
            notification_id,
            current_user.id
        )
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found."
        )

    return mark_ticket_notification_read_repo(
        db,
        notification
    )

@router.patch(
    "/read-all"
)
def mark_all_notifications_read(
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):

    notifications = (
        mark_all_ticket_notifications_read_repo(
            db,
            current_user.id
        )
    )

    return {
        "message": "All notifications marked as read.",
        "count": len(notifications)
    }