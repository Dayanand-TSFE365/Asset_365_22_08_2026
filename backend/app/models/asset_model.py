from sqlalchemy import Column, Integer, String, ForeignKey, DECIMAL, DateTime, Date,Boolean
from sqlalchemy.orm import relationship
from app.db.database import AssetBase
from datetime import datetime


class Asset(AssetBase):
    __tablename__ = "Assets"

    asset_id = Column(Integer, primary_key=True, index=True)

    # 🔹 Basic
    asset_tag = Column(String(50), nullable=False, index=True)
    asset_name = Column(String(150), nullable=False)
    serial_number = Column(String(100))
    image_url = Column(String, nullable=True)

    # 🔹 Relationships
    model_id = Column(Integer, ForeignKey("Product_Models.model_id"), nullable=False)
    status_id = Column(Integer, ForeignKey("Product_Status.status_id"), nullable=False)
    company_id = Column(Integer, ForeignKey("Product_Companies.company_id"), nullable=False)

    checked_out_to = Column(Integer, ForeignKey("AuthUsers.id"), nullable=True)
    location_id = Column(Integer, ForeignKey("Product_Locations.location_id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("Suppliers.supplier_id"), nullable=True)

    # 🔹 Financial
    purchase_cost = Column(DECIMAL(12, 2))
    current_value = Column(DECIMAL(12, 2))

    depreciation_months = Column(Integer, nullable=True)

    # 🔹 Dates
    purchase_date = Column(Date)
    warranty_months = Column(Integer)
    warranty_expires = Column(Date)

    expected_checkin_date = Column(Date)
    next_audit_date = Column(Date)
    last_checkin_date = Column(DateTime)

    # 🔹 Other
    order_number = Column(String(100))
    notes = Column(String)
    condition = Column(String(50))
    
    created_by = Column(Integer)
    
    eol_date = Column(Date, nullable=True)
    
    requestable = Column(Boolean, default=False)
    byod = Column(Boolean, default=False)
    
    is_deleted = Column(Boolean, default=False)

    # 🔹 Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    #  Relationships
    model = relationship("Models")
    status = relationship("Status")
    company = relationship("Companies")
    location = relationship("Locations")
    supplier = relationship("Suppliers")
    user = relationship("AuthUser", foreign_keys=[checked_out_to])
    audits = relationship("AssetAudit", backref="asset")
    
    
    