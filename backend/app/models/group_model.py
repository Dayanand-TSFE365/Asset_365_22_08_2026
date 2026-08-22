from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime
)

from sqlalchemy.sql import func

from app.db.database import AssetBase


class Group(AssetBase):

    __tablename__ = "Groups"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    group_name = Column(
        String,
        unique=True,
        nullable=False
    )


    description = Column(
        String,
        nullable=True
    )


    created_at = Column(
        DateTime,
        server_default=func.now()
    )