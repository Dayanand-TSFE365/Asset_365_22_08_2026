from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean
)

from sqlalchemy.sql import func

from app.db.database import TicketBase


class TicketNotification(TicketBase):

    __tablename__ = "TicketNotifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    ticket_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    notification_type = Column(
        String(50),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    created_by = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False
    )