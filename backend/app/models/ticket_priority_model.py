from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime
)
from sqlalchemy.sql import func

from app.db.database import TicketBase


class TicketPriorityMaster(TicketBase):
    __tablename__ = "TicketPriorityMaster"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    priority_name = Column(
        String(50),
        unique=True,
        nullable=False
    )

    display_order = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )