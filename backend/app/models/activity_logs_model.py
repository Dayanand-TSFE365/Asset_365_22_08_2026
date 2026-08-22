from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.auth_model import AuthUser

from app.db.database import AssetBase


class ActivityLog(AssetBase):

    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    created_by = Column(
        Integer,
        ForeignKey("AuthUsers.id"),
        nullable=False,
        index=True
    )

    module = Column(String, index=True)

    action = Column(String, index=True)

    item_type = Column(String)

    item_id = Column(Integer)

    item_name = Column(String)

    target_user_id = Column(
        Integer,
        ForeignKey("AuthUsers.id"),
        nullable=True
    )

    quantity = Column(Integer, nullable=True)

    notes = Column(Text, nullable=True)

    changes = Column(Text, nullable=True)

    creator = relationship(
        "AuthUser",
        foreign_keys=[created_by]
    )

    target_user = relationship(
        "AuthUser",
        foreign_keys=[target_user_id]
    )