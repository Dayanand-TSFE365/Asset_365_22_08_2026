from sqlalchemy.orm import Session

from app.models.ticket_status_model import (
    TicketStatusMaster
)


def get_ticket_statuses_repo(
    db: Session
):
    return (
        db.query(TicketStatusMaster)
        .order_by(
            TicketStatusMaster.display_order
        )
        .all()
    )