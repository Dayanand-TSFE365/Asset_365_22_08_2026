from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.schemas.ticket_status_schema import UpdateTicketStatusSchema
from app.repository.ticket_status_repo import (
    get_ticket_statuses_repo
)
from app.core.ticket_constants import TICKET_STATUS
from app.repository.ticket_repo import (
    get_ticket_by_id_repo,
    update_ticket_repo
)

from app.services.activity_log_service import log_activity


def get_ticket_statuses_service(
    db: Session
):
    return get_ticket_statuses_repo(db)


def update_ticket_status_service(
    ticket_db: Session,
    asset_db: Session,
    ticket_id: int,
    data: UpdateTicketStatusSchema,
    current_user
):

    ticket = get_ticket_by_id_repo(
        ticket_db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    old_status_id = ticket.status_id

    ticket.status_id = data.status_id

    if data.status_id == TICKET_STATUS["CLOSED"]:
        ticket.closed_at = datetime.now()

    updated_ticket = update_ticket_repo(
        ticket_db,
        ticket
    )

    # -----------------------------------------
    # ACTIVITY LOG
    # -----------------------------------------

    log_activity(
        db=asset_db,
        created_by=current_user.id,
        module="TICKET",
        action="UPDATE_STATUS",
        item_type="TICKET",
        item_id=updated_ticket.id,
        item_name=updated_ticket.ticket_no,
        notes=(
            f"Updated status of ticket "
            f"'{updated_ticket.ticket_no}' "
            f"from '{old_status_id}' "
            f"to '{data.status_id}'."
        ),
        changes={
            "old_status_id": old_status_id,
            "new_status_id": data.status_id,
            "closed_at": (
                str(updated_ticket.closed_at)
                if updated_ticket.closed_at
                else None
            )
        }
    )

    asset_db.commit()

    return updated_ticket