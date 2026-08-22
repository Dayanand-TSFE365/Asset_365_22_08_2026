from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from datetime import datetime
from app.db.database import AssetBase


class ComponentTransaction(AssetBase):
    __tablename__ = "component_transactions"

    id = Column(Integer, primary_key=True, index=True)

    component_id = Column(Integer, ForeignKey("Components.id"))
    user_id = Column(Integer, ForeignKey("AuthUsers.id"))

    type = Column(String)  # checkout / checkin
    quantity = Column(Integer)

    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)