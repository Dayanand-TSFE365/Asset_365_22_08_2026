from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    Time,
    DateTime,
    Boolean,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import TicketBase


class Ticket(TicketBase):
    __tablename__ = "Tickets"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    ticket_no = Column(
        String(30),
        unique=True,
        nullable=False
    )

    scope_of_work = Column(
        Text,
        nullable=True
    )

    priority_id = Column(
        Integer,
        ForeignKey("TicketPriorityMaster.id"),
        nullable=False
    )

    status_id = Column(
        Integer,
        ForeignKey("TicketStatusMaster.id"),
        nullable=False
    )

    # User IDs (Authentication DB)
    assigned_to = Column(
        Integer,
        nullable=True
    )

    created_by = Column(
        Integer,
        nullable=False
    )

    due_date = Column(
        Date,
        nullable=True
    )

    customer_name = Column(
        String(255),
        nullable=True
    )

    meeting_date = Column(
        Date,
        nullable=True
    )

    meeting_time = Column(
        Time,
        nullable=True
    )

    venue = Column(
        String(255),
        nullable=True
    )

    order_no = Column(
        String(100),
        nullable=True
    )

    agenda = Column(
        Text,
        nullable=True
    )

    closed_at = Column(
        DateTime,
        nullable=True
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

    is_deleted = Column(
        Boolean,
        default=False
    )

    # -------------------------
    # Relationships
    # -------------------------

    priority = relationship(
        "TicketPriorityMaster"
    )

    status = relationship(
        "TicketStatusMaster"
    )

    replies = relationship(
        "TicketReply",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )

    attachments = relationship(
        "TicketAttachment",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )

    visit_report = relationship(
        "TicketVisitReport",
        back_populates="ticket",
        uselist=False,
        cascade="all, delete-orphan"
    )
    daily_tasks = relationship(
        "TicketDailyTask",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )