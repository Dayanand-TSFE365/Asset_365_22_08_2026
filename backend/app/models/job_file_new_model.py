from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    BigInteger,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import AssetBase


class JobFileNew(AssetBase):
    __tablename__ = "job_files_new"

    file_id = Column(Integer, primary_key=True)

    sub_job_id = Column(
        Integer,
        ForeignKey("JobSubJobs.sub_job_id"),
        nullable=False
    )

    file_type = Column(String(50), nullable=False)

    original_file_name = Column(String(255))

    stored_file_name = Column(String(255))

    file_path = Column(String(500))

    file_size = Column(BigInteger)

    uploaded_by = Column(Integer)

    uploaded_at = Column(
        DateTime,
        server_default=func.getdate()
    )

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False
    )

    sub_job = relationship(
        "JobSubJob",
        back_populates="files"
    )