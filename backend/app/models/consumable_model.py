# app/models/consumable_model.py

from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from app.db.database import AssetBase
from sqlalchemy.orm import relationship


class Consumable(AssetBase):
    __tablename__ = "consumables"

    consumable_id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True)

    company_id = Column(Integer, ForeignKey("Product_Companies.company_id"), nullable=True)
    category_id = Column(Integer, ForeignKey("Product_Categories.category_id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("Suppliers.supplier_id"), nullable=True)
    manufacturer_id = Column(Integer, ForeignKey("Product_Manufacturers.manufacturer_id"), nullable=True)
    location_id = Column(Integer, ForeignKey("Product_Locations.location_id"), nullable=True)

    model_no = Column(String(100), nullable=True)
    item_no = Column(String(100), nullable=True)
    order_number = Column(String(100), nullable=True)

    purchase_date = Column(Date, nullable=True)

    #  Quantity Logic
    total_qty = Column(Integer, nullable=False)
    remaining_qty = Column(Integer, nullable=False)
    min_qty = Column(Integer, default=0)

    #  Cost
    unit_cost = Column(Numeric(10, 2), nullable=True)
    total_cost = Column(Numeric(12, 2), nullable=True)

    notes = Column(Text, nullable=True)

    created_by = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    #  Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    company = relationship("Companies")
    category = relationship("Categories")
    supplier = relationship("Suppliers")
    manufacturer = relationship("Manufacturers")
    location = relationship("Locations")