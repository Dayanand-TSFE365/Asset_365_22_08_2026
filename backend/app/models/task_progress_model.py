from sqlalchemy import Column, Integer, String, DateTime, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import TaskBase


class TaskProgress(TaskBase):
    __tablename__ = "TaskProgress"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(Integer, nullable=False)

    message = Column(String, nullable=False)

    hours_worked = Column(DECIMAL(10, 2))

    hours_remaining = Column(DECIMAL(10, 2))

    progress = Column(Integer, default=0)

    blockers = Column(String)

    created_by = Column(Integer, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    attachments = relationship(
        "TaskProgressAttachment",
        back_populates="progress",
        primaryjoin="TaskProgress.id == foreign(TaskProgressAttachment.task_progress_id)",
        cascade="all, delete-orphan",
    )