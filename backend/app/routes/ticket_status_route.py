from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_ticket_db, get_asset_db
from app.core.dependencies import get_current_user
from app.services.ticket_status_service import (
    get_ticket_statuses_service,
    update_ticket_status_service
)
from app.schemas.ticket_schema import TicketResponse
from app.schemas.ticket_status_schema import (
    TicketStatusResponse,
    UpdateTicketStatusSchema
)


router = APIRouter(
    prefix="/apiV3/ticket-statuses",
    tags=["Ticket Statuses"]
)


@router.get(
    "",
    response_model=list[TicketStatusResponse]
)
def get_ticket_statuses(
    db: Session = Depends(get_ticket_db)
):
    return get_ticket_statuses_service(db)


@router.patch(
    "/{ticket_id}/status",
    response_model=TicketResponse
)
def update_ticket_status(
    ticket_id: int,
    data: UpdateTicketStatusSchema,
    ticket_db: Session = Depends(get_ticket_db),
    asset_db: Session= Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return update_ticket_status_service(
        ticket_db=ticket_db,
        asset_db=asset_db,
        ticket_id=ticket_id,
        data=data,
        current_user=current_user
    )