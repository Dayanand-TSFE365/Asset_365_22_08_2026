from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime
)

from sqlalchemy.sql import func

from app.db.database import AssetBase


class GroupPermission(AssetBase):

    __tablename__ = "GroupPermissions"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    group_id = Column(

        Integer,

        ForeignKey(
            "Groups.id",
            ondelete="CASCADE"
        ),

        nullable=False
    )


    permission_id = Column(

        Integer,

        ForeignKey(
            "Permissions.id",
            ondelete="CASCADE"
        ),

        nullable=False
    )


    created_at = Column(
        DateTime,
        server_default=func.now()
    )