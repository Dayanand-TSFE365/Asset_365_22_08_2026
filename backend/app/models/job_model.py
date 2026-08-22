from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Date
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import AssetBase

class JobStatusMaster(AssetBase):
    __tablename__ = "JobStatusMaster"

    status_id = Column(Integer, primary_key=True)
    status_name = Column(String(100), unique=True, nullable=False)
    display_order = Column(Integer)
    is_active = Column(Boolean, default=True)

class Job(AssetBase):
    __tablename__ = "Jobs"

    job_id = Column(Integer, primary_key=True, index=True)

    job_no = Column(String(50), unique=True, nullable=False)
    panel_description = Column(String(255))
    panel_quantity = Column(Integer)
    customer_name = Column(String(255))

    # Document Status
    as_build = Column(Boolean, default=False)
    soft_copy = Column(Boolean, default=False)
    hard_copy = Column(Boolean, default=False)
    factory_test_report = Column(Boolean, default=False)

    # Person Name
    site_commissioned = Column(String(255))

    # BOM
    bom_excel = Column(Boolean, default=False)
    bom_pdf = Column(Boolean, default=False)
    bom_updated_on_erp = Column(Boolean, default=False)
    bom_updated_on_tally = Column(Boolean, default=False)

    # Other Documents
    photos = Column(Boolean, default=False)
    backup_file = Column(Boolean, default=False)

    # New Fields
    so_no = Column(String(100))
    mom_by = Column(String(255))
    mom_uploaded = Column(Boolean, default=False)
    job_date = Column(Date)

    tested_by = Column(String(255))

    created_at = Column(
        DateTime,
        server_default=func.getdate()
    )
    end_user = Column(String(255),nullable=True)

    job_status_id = Column(
        Integer,
        ForeignKey("JobStatusMaster.status_id"),
        nullable=True
    )

    remarks_action = Column(String,nullable=True)

    job_status = relationship("JobStatusMaster")

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


    files = relationship(
        "JobFile",
        back_populates="job"
    )

#     permissions = relationship(
#     "JobUserPermission",
#     back_populates="job",
#     cascade="all, delete-orphan"
# )
    


