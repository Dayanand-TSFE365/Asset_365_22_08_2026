from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.db.database import (
    get_ticket_db
)

from app.core.dependencies import (
    get_current_user
)

from app.services.ticket_attachment_service import (
    download_ticket_attachment_service,
    delete_ticket_attachment_service
)

router = APIRouter(
    prefix="/apiV3/ticket-attachments",
    tags=["Ticket Attachments"]
)


@router.get(
    "/{attachment_id}/download"
)
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):
    return download_ticket_attachment_service(
        db=db,
        attachment_id=attachment_id
    )


@router.delete(
    "/{attachment_id}"
)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_ticket_db),
    current_user=Depends(get_current_user)
):
    return delete_ticket_attachment_service(
        db=db,
        attachment_id=attachment_id
    )