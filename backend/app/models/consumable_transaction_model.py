# app/models/consumable_transaction_model.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.database import AssetBase


class ConsumableTransaction(AssetBase):
    __tablename__ = "consumable_transactions"

    id = Column(Integer, primary_key=True, index=True)

    consumable_id = Column(Integer, ForeignKey("consumables.consumable_id"))
    user_id = Column(Integer, nullable=True)

    quantity = Column(Integer, nullable=False)

    action = Column(String(20))  # 'consume' / 'add'

    notes = Column(Text, nullable=True)

    created_by = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())