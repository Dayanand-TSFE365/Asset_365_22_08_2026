from sqlalchemy import (
    Column,
    Integer,
    ForeignKey
)

from app.db.database import AssetBase


class RolePermission(AssetBase):

    __tablename__="RolePermissions"

    role_id=Column(
        Integer,
        ForeignKey("Roles.id"),
        primary_key=True
    )

    permission_id=Column(
        Integer,
        ForeignKey("Permissions.id"),
        primary_key=True
    )