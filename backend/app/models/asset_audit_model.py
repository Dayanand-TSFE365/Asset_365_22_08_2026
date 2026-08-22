from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from datetime import datetime
from app.db.database import AssetBase



class AssetAudit(AssetBase):
    __tablename__ = "AssetAudit"

    audit_id = Column(Integer, primary_key=True, index=True)

    asset_id = Column(Integer, ForeignKey("Assets.asset_id"), nullable=False)
    audited_by = Column(Integer, ForeignKey("AuthUsers.id"), nullable=True)

    audit_date = Column(DateTime, default=datetime.utcnow)

    status = Column(String(50))
    remarks = Column(String)

    next_audit_date = Column(Date)
    image_url = Column(String, nullable=True)
    
    