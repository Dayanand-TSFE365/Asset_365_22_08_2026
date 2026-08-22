from sqlalchemy.orm import Session
from typing import Optional

from app.models.ticket_model import (
    Ticket
)
from sqlalchemy import func,text






def get_next_ticket_sequence_repo(
    db: Session
) -> int:

    result = db.execute(
        text(
            "SELECT NEXT VALUE FOR TicketNoSequence"
        )
    )

    return result.scalar()
def create_ticket_repo(
    db: Session,
    ticket: Ticket
):
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket

def get_tickets_repo(
    db: Session,
    assigned_to: Optional[int] = None,
    created_by: Optional[int] = None,
    status_id: Optional[int] = None,
    priority_id: Optional[int] = None,
):
    query = (
        db.query(Ticket)
        .filter(
            Ticket.is_deleted == False
        )
    )

    if assigned_to is not None:
        query = query.filter(
            Ticket.assigned_to == assigned_to
        )

    if created_by is not None:
        query = query.filter(
            Ticket.created_by == created_by
        )

    if status_id is not None:
        query = query.filter(
            Ticket.status_id == status_id
        )

    if priority_id is not None:
        query = query.filter(
            Ticket.priority_id == priority_id
        )

    return (
        query
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )


def get_ticket_by_id_repo(
    db: Session,
    ticket_id: int
):
    return (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id,
            Ticket.is_deleted == False
        )
        .first()
    )



def get_last_ticket_id_repo(db: Session):

    return db.query(
        func.max(Ticket.id)
    ).scalar()


def update_ticket_repo(
    db: Session,
    ticket: Ticket
):
    db.commit()
    db.refresh(ticket)

    return ticket


def delete_ticket_repo(
    db: Session,
    ticket: Ticket
):
    ticket.is_deleted = True

    db.commit()
    db.refresh(ticket)

    return ticket

def get_ticket_by_ticket_no_repo(
    db: Session,
    ticket_no: str
):
    return (
        db.query(Ticket)
        .filter(
            Ticket.ticket_no == ticket_no,
            Ticket.is_deleted == False
        )
        .first()
    )

def get_assigned_tickets_repo(
    db: Session,
    user_id: int
):
    return (
        db.query(Ticket)
        .filter(
            Ticket.assigned_to == user_id,
            Ticket.is_deleted == False
        )
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )

def get_created_tickets_repo(
    db: Session,
    user_id: int
):
    return (
        db.query(Ticket)
        .filter(
            Ticket.created_by == user_id,
            Ticket.is_deleted == False
        )
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )

def get_ticket_for_restore_repo(
    db: Session,
    ticket_id: int
):

    return (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )


def get_deleted_tickets_repo(
    db: Session
):
    return (
        db.query(Ticket)
        .filter(
            Ticket.is_deleted == True
        )
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )


def get_deleted_ticket_by_id_repo(
    db: Session,
    ticket_id: int
):
    return (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id,
            Ticket.is_deleted == True
        )
        .first()
    )


def restore_ticket_repo(
    db: Session,
    ticket: Ticket
):
    ticket.is_deleted = False

    return ticket


def permanently_delete_ticket_repo(
    db: Session,
    ticket: Ticket
):
    db.delete(ticket)