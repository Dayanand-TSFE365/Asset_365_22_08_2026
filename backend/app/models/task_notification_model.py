from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Text,
)
from sqlalchemy.sql import func

from app.db.database import TaskBase


class TaskNotification(TaskBase):
    __tablename__ = "TaskNotifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    task_id = Column(
        Integer,
        nullable=False,
    )

    user_id = Column(
        Integer,
        nullable=False,
    )

    notification_type = Column(
        String(50),
        nullable=False,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=True,
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_by = Column(
        Integer,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    read_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )