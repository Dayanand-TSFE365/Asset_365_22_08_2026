from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Text
from datetime import datetime

from app.db.database import AssetBase


class AssetRequest(AssetBase):
    __tablename__ = "Asset_Requests"

    request_id = Column(Integer, primary_key=True, index=True)

    asset_id = Column(Integer, ForeignKey("Assets.asset_id"), nullable=False)

    requested_by = Column(Integer, nullable=False)

    request_date = Column(DateTime, default=datetime.utcnow)

    expected_checkin_date = Column(Date, nullable=True)

    status = Column(String(50), default="Pending")
    # Pending
    # Approved
    # Rejected
    # Cancelled
    # CheckedOut

    approved_by = Column(Integer, nullable=True)

    approved_at = Column(DateTime, nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)