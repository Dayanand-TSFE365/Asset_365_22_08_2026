from sqlalchemy import Column, Integer, String, Date, Boolean, DECIMAL, ForeignKey, DateTime
from app.db.database import AssetBase
from datetime import datetime
from sqlalchemy.orm import relationship

class License(AssetBase):
    __tablename__ = "Licenses"

    license_id = Column(Integer, primary_key=True, index=True)

    Software_name = Column(String)
    product_key = Column(String)

    total = Column(Integer)
    available = Column(Integer)
    min_qty = Column(Integer)

    expiration_date = Column(Date)
    termination_date = Column(Date)

    licensed_to = Column(String)
    licensed_to_email = Column(String)

    purchase_date = Column(Date)
    purchase_cost = Column(DECIMAL)
    depreciation = Column(DECIMAL)

    maintained = Column(Boolean, default=False)
    reassignable = Column(Boolean, default=True)

    order_number = Column(String)
    purchase_order_number = Column(String)

    notes = Column(String)

    company_id = Column(Integer, ForeignKey("Product_Companies.company_id"))
    supplier_id = Column(Integer, ForeignKey("Suppliers.supplier_id"))
    manufacturer_id = Column(Integer, ForeignKey("Product_Manufacturers.manufacturer_id"))
    category_id = Column(Integer, ForeignKey("Product_Categories.category_id"))

    created_by = Column(Integer, ForeignKey("AuthUsers.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime)
    is_deleted = Column(Boolean, default=False)
    
     # Relationships
    logs = relationship("LicenseLog", back_populates="license")