from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime
)

from sqlalchemy.sql import func

from app.db.database import AssetBase


class UserGroup(AssetBase):

    __tablename__ = "UserGroups"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    user_id = Column(

        Integer,

        ForeignKey(
            "AuthUsers.id",
            ondelete="CASCADE"
        ),

        nullable=False
    )


    group_id = Column(

        Integer,

        ForeignKey(
            "Groups.id",
            ondelete="CASCADE"
        ),

        nullable=False
    )


    created_at = Column(
        DateTime,
        server_default=func.now()
    )