from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Boolean,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import AssetBase


class JobNew(AssetBase):
    __tablename__ = "Jobs_New"

    job_id = Column(Integer, primary_key=True, index=True)

    job_no = Column(String(50), unique=True, nullable=False)

    customer_name = Column(String(255))

    site_commissioned = Column(String(255))

    so_no = Column(String(100))

    mom_by = Column(String(255))

    job_date = Column(Date)

    tested_by = Column(String(255))

    end_user = Column(String(255))

    job_status_id = Column(
        Integer,
        ForeignKey("JobStatusMaster.status_id"),
        nullable=True
    )

    remarks_action = Column(String)

    created_at = Column(
        DateTime,
        server_default=func.getdate()
    )

    updated_at = Column(
        DateTime,
        server_default=func.getdate(),
        onupdate=func.getdate()
    )

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False
    )

    job_status = relationship("JobStatusMaster")

    sub_jobs = relationship(
        "JobSubJob",
        back_populates="job",
        cascade="all, delete-orphan"
    )

    permissions = relationship(
    "JobUserPermission",
    back_populates="job",
    cascade="all, delete-orphan"
)