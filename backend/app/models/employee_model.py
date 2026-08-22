from sqlalchemy import Column, Integer, String, DateTime, ForeignKey,Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import AssetBase


class Employee(AssetBase):
    __tablename__ = "Employees"

    id = Column(Integer, primary_key=True, index=True)

    auth_user_id = Column(Integer, ForeignKey("AuthUsers.id"), unique=True,nullable=False)

    employee_code = Column(String, unique=True, nullable=False)

    full_name = Column(String, nullable=False)

    email = Column(String)
    phone = Column(String)

    department = Column(String)
    designation = Column(String)
    profile_image = Column(String, nullable=True)

    status = Column(String, default="Active")
    is_deleted = Column(
    Boolean,
    default=False
)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    auth_user = relationship("AuthUser", back_populates="employee")