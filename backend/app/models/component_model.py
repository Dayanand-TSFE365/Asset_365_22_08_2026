from sqlalchemy import Column, Integer, String, Date, Float, Text, DateTime, ForeignKey
from datetime import datetime
from app.db.database import AssetBase


class Component(AssetBase):
    __tablename__ = "Components"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    company_id = Column(Integer, ForeignKey("Product_Companies.company_id", ondelete="SET NULL"))
    category_id = Column(Integer, ForeignKey("Product_Categories.category_id", ondelete="SET NULL"))
    supplier_id = Column(Integer, ForeignKey("Suppliers.supplier_id", ondelete="SET NULL"))
    manufacturer_id = Column(Integer, ForeignKey("Product_Manufacturers.manufacturer_id", ondelete="SET NULL"))
    location_id = Column(Integer, ForeignKey("Product_Locations.location_id", ondelete="SET NULL"))

    serial_no = Column(String)
    model_no = Column(String)
    order_number = Column(String)

    purchase_date = Column(Date)

    min_qty = Column(Integer, default=0)
    total_qty = Column(Integer, default=0)
    remaining_qty = Column(Integer, default=0)

    unit_cost = Column(Float)
    total_cost = Column(Float)
    is_deleted = Column(Integer, default=0)

    notes = Column(Text)
    image_url = Column(String)

    created_by = Column(Integer, ForeignKey("AuthUsers.id", ondelete="SET NULL"))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)