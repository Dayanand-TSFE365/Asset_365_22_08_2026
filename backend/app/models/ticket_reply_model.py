from sqlalchemy import (
    Column,
    Integer,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import  TicketBase


class TicketReply(TicketBase):
    __tablename__ = "TicketReplies"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    ticket_id = Column(
        Integer,
        ForeignKey("Tickets.id"),
        nullable=False
    )

    sender_id = Column(
    Integer,
    nullable=False
)

    message = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    ticket = relationship(
        "Ticket",
        back_populates="replies"
    )

    attachments = relationship(
        "TicketAttachment",
        back_populates="reply",
        cascade="all, delete-orphan"
    )

    