from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
)
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.sql import func

from app.db.database import TaskBase


class TaskChecklist(TaskBase):
    __tablename__ = "TaskChecklist"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(Integer, nullable=False)

    title = Column(String(500), nullable=False)

    is_completed = Column(Boolean, default=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    task = relationship(
        "Task",
        back_populates="checklists",
        primaryjoin="Task.id == foreign(TaskChecklist.task_id)"
    )