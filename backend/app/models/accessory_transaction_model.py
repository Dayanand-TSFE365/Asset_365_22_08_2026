from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.db.database import AssetBase
from datetime import datetime


class AccessoryTransaction(AssetBase):
    __tablename__ = "accessory_transactions"

    id = Column(Integer, primary_key=True, index=True)

    accessory_id = Column(Integer, ForeignKey("accessories.accessory_id"))
    user_id = Column(Integer)

    quantity = Column(Integer)

    action = Column(String)  # "checkout" or "checkin"

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)