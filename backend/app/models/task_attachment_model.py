from sqlalchemy import (
    Column,
    Integer,
    String,
    BigInteger,
    DateTime,
)
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.sql import func

from app.db.database import TaskBase


class TaskAttachment(TaskBase):
    __tablename__ = "TaskAttachments"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(Integer, nullable=False)

    file_name = Column(String(255), nullable=False)

    file_path = Column(String(1000), nullable=False)

    file_size = Column(BigInteger, nullable=True)

    uploaded_by = Column(Integer, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    task = relationship(
        "Task",
        back_populates="attachments",
        primaryjoin="Task.id == foreign(TaskAttachment.task_id)"
    )