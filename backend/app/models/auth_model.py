from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from app.db.database import AssetBase
from sqlalchemy.orm import relationship
from datetime import datetime 

class AuthUser(AssetBase):
    __tablename__ = "AuthUsers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    
    contact_number = Column(String(20))
    company_name = Column(String(150))
    
    role = Column(String, default="user")
    is_active = Column(Boolean)
    failed_attempts = Column(Integer,default=0,nullable=False)
    
    
    is_verified = Column(Boolean, default=False,nullable=False)
    verification_token = Column(String, nullable=True)
    
    reset_otp = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)

    is_approved = Column(Boolean, default=False,nullable=False)
    approval_token = Column(String, nullable=True)
    is_default_profile =Column(Boolean, default=False, nullable=False)

    access_type = Column(
        String(20),
        nullable=True
    )

    access_expires_at = Column(
        DateTime,
        nullable=True
    )

    access_extension_requested = Column(
        Boolean,
        default=False,
        nullable=False
    )

    access_extension_requested_at = Column(
        DateTime,
        nullable=True
    )

    access_extension_status = Column(
        String(20),
        nullable=True
    )
    
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    employee = relationship(
    "Employee",
    back_populates="auth_user",
    uselist=False
    )
    # tickets_created = relationship(
    # "Ticket",
    # foreign_keys="Ticket.created_by",
    # back_populates="creator"
    # )

    # tickets_assigned = relationship(
    # "Ticket",
    # foreign_keys="Ticket.assigned_to",
    # back_populates="assignee"
    # )

class RefreshToken(AssetBase):
    __tablename__ = "RefreshTokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("AuthUsers.id"))
    token = Column(String)
    expires_at = Column(DateTime)
    is_revoked = Column(Boolean)
    
    

    
    
    
