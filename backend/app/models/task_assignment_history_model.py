from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
)
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.sql import func

from app.db.database import TaskBase


class TaskAssignmentHistory(TaskBase):
    __tablename__ = "TaskAssignmentHistory"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(Integer, nullable=False)

    old_assignee = Column(Integer, nullable=True)

    new_assignee = Column(Integer, nullable=False)

    note = Column(String(1000), nullable=True)
    reason = Column(
        String,
        nullable=True,
    )

    assigned_by = Column(Integer, nullable=False)

    assigned_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    task = relationship(
        "Task",
        back_populates="assignment_history",
        primaryjoin="Task.id == foreign(TaskAssignmentHistory.task_id)"
    )