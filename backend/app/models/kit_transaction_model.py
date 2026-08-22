from sqlalchemy import Boolean, Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from app.db.database import AssetBase


class KitTransaction(AssetBase):
    __tablename__ = "kit_transactions"

    id = Column(Integer, primary_key=True, index=True)

    kit_id = Column(Integer, ForeignKey("Kits.id"), nullable=False)
    user_id = Column(Integer, nullable=False)

    checkout_date = Column(DateTime(timezone=True), nullable=True)
    expected_checkin_date = Column(DateTime(timezone=True), nullable=True)
    is_checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())