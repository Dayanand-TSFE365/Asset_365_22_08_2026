from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import AssetBase


class JobSubJob(AssetBase):
    __tablename__ = "JobSubJobs"

    sub_job_id = Column(Integer, primary_key=True)

    job_id = Column(
        Integer,
        ForeignKey("Jobs_New.job_id"),
        nullable=False
    )

    sub_job_sequence = Column(Integer, nullable=False)

    sub_job_no = Column(String(50), nullable=False)

    panel_description = Column(String(255))

    panel_quantity = Column(Integer, default=1)

    as_build = Column(Boolean, default=False)
    soft_copy = Column(Boolean, default=False)
    hard_copy = Column(Boolean, default=False)
    factory_test_report = Column(Boolean, default=False)

    bom_excel = Column(Boolean, default=False)
    bom_pdf = Column(Boolean, default=False)
    bom_updated_on_erp = Column(Boolean, default=False)
    bom_updated_on_tally = Column(Boolean, default=False)

    photos = Column(Boolean, default=False)
    notes_and_tech_note = Column(Boolean, default=False)

    additional_data = Column(Boolean, default=False)
    backup_file = Column(Boolean, default=False)
    mom_uploaded = Column(Boolean, default=False)

    remarks = Column(String)

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
        default=False
    )

    job = relationship(
        "JobNew",
        back_populates="sub_jobs"
    )

    files = relationship(
        "JobFileNew",
        back_populates="sub_job",
        cascade="all, delete-orphan"
    )