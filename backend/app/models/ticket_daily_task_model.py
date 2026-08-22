from sqlalchemy import (
    Column,
    Integer,
    Text,
    Boolean,
    DateTime,
    Date,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import TicketBase


class TicketDailyTask(TicketBase):
    __tablename__ = "TicketDailyTasks"

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

    task_description = Column(
        Text,
        nullable=False
    )

    is_selected = Column(
        Boolean,
        default=False,
        nullable=False
    )
    work_date = Column(
    Date,
    nullable=False,
    server_default=func.getdate()
)

    created_by = Column(
        Integer,
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
        back_populates="daily_tasks"
    )