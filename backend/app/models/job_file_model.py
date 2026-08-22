from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    BigInteger,
    func,
    Boolean
)
from sqlalchemy.orm import relationship

from app.db.database import AssetBase


class JobFile(AssetBase):
    __tablename__ = "job_files"

    file_id = Column(Integer, primary_key=True)
    job_id = Column(
        Integer,
        ForeignKey("Jobs.job_id"),
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

    job = relationship(
        "Job",
        back_populates="files"
    )