

from datetime import datetime
from app.db.database import AssetBase

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text


class Accessory(AssetBase):

    __tablename__ = "accessories"

    accessory_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    image_url = Column(String(500))

    company_id = Column(Integer, ForeignKey("Product_Companies.company_id"))
    category_id = Column(Integer, ForeignKey("Product_Categories.category_id"))

    model_no = Column(String(100))

    manufacturer_id = Column(Integer, ForeignKey("Product_Manufacturers.manufacturer_id"))
    supplier_id = Column(Integer, ForeignKey("Suppliers.supplier_id"))
    location_id = Column(Integer, ForeignKey("Product_Locations.location_id"))

    min_qty = Column(Integer, default=0)
    total_qty = Column(Integer, nullable=False)
    available_qty = Column(Integer, nullable=False)
    checked_out_qty = Column(Integer, default=0)
    

    purchase_date = Column(Date)

    unit_cost = Column(Numeric(10, 2))
    total_cost = Column(Numeric(12, 2))

    order_number = Column(String(100))
    notes = Column(Text)

    created_by = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    deleted_at = Column(DateTime, nullable=True)