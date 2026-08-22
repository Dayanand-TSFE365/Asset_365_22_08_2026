from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_ticket_db

from app.services.ticket_priority_service import (
    get_ticket_priorities_service
)

from app.schemas.ticket_priority_schema import (
    TicketPriorityResponse
)

router = APIRouter(
    prefix="/apiV3/ticket-priorities",
    tags=["Ticket Priorities"]
)


@router.get(
    "",
    response_model=list[TicketPriorityResponse]
)
def get_ticket_priorities(
    db: Session = Depends(get_ticket_db)
):
    return get_ticket_priorities_service(db)