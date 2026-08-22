from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import AssetBase
from sqlalchemy.orm import relationship


class LicenseLog(AssetBase):
    __tablename__ = "LicenseLogs"

    log_id = Column(Integer, primary_key=True, index=True)

    license_id = Column(Integer, ForeignKey("Licenses.license_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("AuthUsers.id"), nullable=True)

    action = Column(String(20), nullable=False)  # 'checkout' / 'checkin'
    action_date = Column(DateTime(timezone=True), server_default=func.now())

    note = Column(String, nullable=True)

    created_by = Column(Integer, ForeignKey("AuthUsers.id"), nullable=True)

    # 🔹 Relationships (optional but useful)
    license = relationship("License", back_populates="logs")
    user = relationship("AuthUser", foreign_keys=[user_id])
    creator = relationship("AuthUser", foreign_keys=[created_by])