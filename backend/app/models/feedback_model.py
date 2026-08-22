from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.db.database import AssetBase

class Feedback(AssetBase):
    __tablename__ = "Feedback"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("AuthUsers.id"),
        nullable=False,
        index=True
    )

    rating = Column(
        Integer,
        nullable=False
    )

    category = Column(
        String(50),
        nullable=False
    )

    subject = Column(
        String(200),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    status = Column(
        String(30),
        nullable=False,
        default="Pending"
    )

    admin_response = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.getdate(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.getdate(),
        onupdate=func.getdate(),
        nullable=False
    )