from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.db.database import AssetBase


class AssetLog(AssetBase):
    __tablename__ = "AssetLogs"

    log_id = Column(Integer, primary_key=True, index=True)

    asset_id = Column(Integer, ForeignKey("Assets.asset_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("AuthUsers.id"), nullable=True)

    action = Column(String(50))  # checkout, checkin, update, etc.
    action_date = Column(DateTime, default=datetime.utcnow)