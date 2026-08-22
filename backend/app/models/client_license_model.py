# models/client_license_model.py
from sqlalchemy.orm import relationship
from sqlalchemy import (
Column,
Integer,
String,
Date,
DateTime,
Numeric,
ForeignKey,
Text,
Boolean
)
from sqlalchemy.sql import func
from app.db.database import AssetBase


class LicenseType(AssetBase):
    __tablename__ = "LicenseTypes"

    license_type_id = Column(Integer, primary_key=True)
    name = Column(String(100))

class ClientLicense(AssetBase):
    __tablename__ = "ClientLicenses"

    license_id = Column(Integer, primary_key=True, index=True)

    license_type_id = Column(
        Integer,
        ForeignKey("LicenseTypes.license_type_id"),
        nullable=False
    )

    job_po_no = Column(String(255), nullable=True)
    client_name = Column(String(255), nullable=True)

    product_name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    serial_number = Column(String(255), nullable=True)
    product_key = Column(Text, nullable=True)

    email_id = Column(String(255), nullable=True)
    password = Column(String(500), nullable=True)

    note_1 = Column(Text, nullable=True)
    note_2 = Column(Text, nullable=True)

    remarks = Column(Text, nullable=True)

    expired_on = Column(Date, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    supplier_id = Column(
        Integer,
        ForeignKey("Suppliers.supplier_id"),
        nullable=True
    )

    order_number = Column(String(255), nullable=True)
    purchase_order_number = Column(String(255), nullable=True)

    purchase_date = Column(Date, nullable=True)
    purchase_cost = Column(Numeric(18, 2), nullable=True)

    customer_po = Column(
    String(255),
    nullable=True
    )

    contract = Column(
        String(255),
        nullable=True
    )

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    files = relationship(
    "LicenseFile",
    back_populates="license",
    cascade="all, delete-orphan"
    )

