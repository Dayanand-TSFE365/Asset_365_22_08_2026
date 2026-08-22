from sqlalchemy.orm import Session

from app.models.ticket_priority_model import (
    TicketPriorityMaster
)


def get_ticket_priorities_repo(
    db: Session
):
    return (
        db.query(TicketPriorityMaster)
        .order_by(
            TicketPriorityMaster.display_order
        )
        .all()
    )