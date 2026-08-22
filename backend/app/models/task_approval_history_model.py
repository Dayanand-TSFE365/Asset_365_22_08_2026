from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from sqlalchemy.orm import relationship
from sqlalchemy.orm import foreign

from app.db.database import TaskBase


class TaskApprovalHistory(TaskBase):

    __tablename__ = "TaskApprovalHistory"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(Integer, nullable=False)

    decision = Column(String(20), nullable=False)

    comment = Column(String, nullable=True)

    rating = Column(Integer, nullable=True)

    approved_by = Column(Integer, nullable=False)

    approved_at = Column(
        DateTime,
        server_default=func.now(),
    )

    task = relationship(
        "Task",
        back_populates="approval_history",
        primaryjoin="Task.id == foreign(TaskApprovalHistory.task_id)"
    )