from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime
)
from sqlalchemy.sql import func

from app.db.database import TicketBase


class TicketStatusMaster(TicketBase):
    __tablename__ = "TicketStatusMaster"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    status_name = Column(
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