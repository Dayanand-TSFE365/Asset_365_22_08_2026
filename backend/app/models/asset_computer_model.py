# models/asset_computer_model.py

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Numeric,
    ForeignKey,
    Boolean
)
from sqlalchemy.sql import func
from app.db.database import AssetBase


class AssetComputerDetails(AssetBase):
    __tablename__ = "AssetComputerDetails"

    computer_detail_id = Column(Integer, primary_key=True, index=True)

    assigned_to = Column(String(255), nullable=True)
    asset_no = Column(String(100), nullable=True)
    client_name = Column(String(255), nullable=True)
    job_po_no = Column(String(255), nullable=True)

    pc_name = Column(String(255), nullable=False)

    administrator_name = Column(String(255), nullable=True)
    administrator_password = Column(String(500), nullable=True)

    operating_system = Column(String(255), nullable=True)
    office_version = Column(String(255), nullable=True)

    rockwell_software = Column(String, nullable=True)
    other_software = Column(String, nullable=True)

    item_description = Column(String(500), nullable=True)

    year_of_mfg = Column(Integer, nullable=True)
    warranty_expire = Column(Date, nullable=True)

    email_id = Column(
    String(255),
    nullable=True
    )

    email_password = Column(
        String(500),
        nullable=True
    )

    manufacturer_id = Column(
        Integer,
        ForeignKey("Product_Manufacturers.manufacturer_id"),
        nullable=True
    )

    serial_no = Column(String(255), nullable=True)

    system_configuration = Column(String, nullable=True)

    supplier_id = Column(
        Integer,
        ForeignKey("Suppliers.supplier_id"),
        nullable=True
    )

    order_number = Column(String(255), nullable=True)
    purchase_order_number = Column(String(255), nullable=True)

    purchase_date = Column(Date, nullable=True)
    configure_date = Column(Date,nullable=True)
    purchase_cost = Column(Numeric(18, 2), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    asset_type = Column(String(20), nullable=False, default="COMPANY")