from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime

from app.db.database import TaskBase


class TaskStatusHistory(TaskBase):
    __tablename__ = "TaskStatusHistory"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    task_id = Column(
        Integer,
        nullable=False,
        index=True,
    )

    old_status = Column(
        String(50),
        nullable=False,
    )

    new_status = Column(
        String(50),
        nullable=False,
    )

    remarks = Column(
        String,
        nullable=True,
    )

    changed_by = Column(
        Integer,
        nullable=False,
    )

    changed_at = Column(
        DateTime,
        default=datetime.utcnow,
    )