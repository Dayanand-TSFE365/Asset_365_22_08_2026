from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    BigInteger,
    Boolean
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import AssetBase


class LicenseFile(AssetBase):

    __tablename__ = "LicenseFiles"

    file_id = Column(
        Integer,
        primary_key=True
    )

    license_id = Column(
        Integer,
        ForeignKey(
            "ClientLicenses.license_id"
        ),
        nullable=False
    )

    original_file_name = Column(
        String(255)
    )

    stored_file_name = Column(
        String(255)
    )

    file_path = Column(
        String(500)
    )

    file_size = Column(
        BigInteger
    )

    uploaded_by = Column(
        Integer
    )

    uploaded_at = Column(
        DateTime,
        server_default=func.now()
    )

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False
    )

    license = relationship(
        "ClientLicense",
        back_populates="files"
    )