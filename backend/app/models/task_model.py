from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    DECIMAL,
    Boolean,
    Text,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import TaskBase


class Task(TaskBase):
    __tablename__ = "Tasks"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    status = Column(String(30), nullable=False, default="Pending")
    priority = Column(String(20), nullable=False, default="Medium")

    department = Column(String(100), nullable=True)

    estimated_hours = Column(DECIMAL(10, 2), nullable=True)

    deadline = Column(DateTime, nullable=True)

    created_by = Column(Integer, nullable=False)
    assigned_to = Column(Integer, nullable=True)

    is_deleted = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    # attachments = relationship(
    #     "TaskAttachment",
    #     back_populates="task",
    #     cascade="all, delete-orphan",
    # )
    attachments = relationship(
        "TaskAttachment",
        back_populates="task",
        primaryjoin="Task.id == foreign(TaskAttachment.task_id)",
        cascade="all, delete-orphan",
    )
    approval_history = relationship(
    "TaskApprovalHistory",
    back_populates="task",
    primaryjoin="Task.id == foreign(TaskApprovalHistory.task_id)"
)

    # checklists = relationship(
    #     "TaskChecklist",
    #     back_populates="task",
    #     cascade="all, delete-orphan",
    # )
    checklists = relationship(
        "TaskChecklist",
        back_populates="task",
        primaryjoin="Task.id == foreign(TaskChecklist.task_id)",
        cascade="all, delete-orphan",
    )

    # assignment_history = relationship(
    #     "TaskAssignmentHistory",
    #     back_populates="task",
    #     cascade="all, delete-orphan",
    # )
    assignment_history = relationship(
        "TaskAssignmentHistory",
        back_populates="task",
        primaryjoin="Task.id == foreign(TaskAssignmentHistory.task_id)",
        cascade="all, delete-orphan",
    )