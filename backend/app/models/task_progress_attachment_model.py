from sqlalchemy import Column, Integer, String, BigInteger, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import TaskBase


class TaskProgressAttachment(TaskBase):
    __tablename__ = "TaskProgressAttachments"

    id = Column(Integer, primary_key=True, index=True)

    task_progress_id = Column(Integer, nullable=False)

    file_name = Column(String(255), nullable=False)

    file_path = Column(String(500), nullable=False)

    file_size = Column(BigInteger)

    uploaded_by = Column(Integer, nullable=False)

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    progress = relationship(
        "TaskProgress",
        back_populates="attachments",
        primaryjoin="TaskProgress.id == foreign(TaskProgressAttachment.task_progress_id)",
    )