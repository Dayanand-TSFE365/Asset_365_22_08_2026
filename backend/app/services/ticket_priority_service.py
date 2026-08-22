from sqlalchemy.orm import Session

from app.repository.ticket_priority_repo import (
    get_ticket_priorities_repo
)


def get_ticket_priorities_service(
    db: Session
):
    return get_ticket_priorities_repo(db)