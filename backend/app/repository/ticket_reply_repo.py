from sqlalchemy.orm import Session

from app.models.ticket_reply_model import (
    TicketReply
)


def create_ticket_reply_repo(
    db: Session,
    reply: TicketReply
):
    db.add(reply)
    db.commit()
    db.refresh(reply)

    return reply


def get_ticket_replies_repo(
    db: Session,
    ticket_id: int
):
    return (
        db.query(TicketReply)
        .filter(
            TicketReply.ticket_id == ticket_id
        )
        .order_by(
            TicketReply.created_at.asc()
        )
        .all()
    )


def update_ticket_reply_repo(
    db: Session,
    reply: TicketReply
):
    db.commit()
    db.refresh(reply)

    return reply


def get_ticket_reply_by_id_repo(
    db: Session,
    reply_id: int
):
    return (
        db.query(TicketReply)
        .filter(
            TicketReply.id == reply_id
        )
        .first()
    )