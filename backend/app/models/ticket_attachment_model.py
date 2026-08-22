

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    BigInteger,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import TicketBase


class TicketAttachment(TicketBase):
    __tablename__ = "TicketAttachments"

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

    reply_id = Column(
        Integer,
        ForeignKey("TicketReplies.id"),
        nullable=True
    )

    original_file_name = Column(
        String(255),
        nullable=False
    )

    stored_file_name = Column(
        String(255),
        nullable=False,
        unique=True
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    file_size = Column(
        BigInteger,
        nullable=False
    )

    file_extension = Column(
        String(20),
        nullable=True
    )

    mime_type = Column(
        String(100),
        nullable=True
    )

    uploaded_by = Column(
    Integer,
    nullable=False
    )
    uploaded_at = Column(
        DateTime,
        server_default=func.now()
    )

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False
    )

    ticket = relationship(
        "Ticket",
        back_populates="attachments"
    )

    reply = relationship(
        "TicketReply",
        back_populates="attachments"
    )