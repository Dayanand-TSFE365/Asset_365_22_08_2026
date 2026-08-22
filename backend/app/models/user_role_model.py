from sqlalchemy import (
    Column,
    Integer,
    ForeignKey
)
from app.db.database import AssetBase

class UserRole(AssetBase):

    __tablename__="UserRoles"

    user_id=Column(
        Integer,
        ForeignKey(
            "AuthUsers.id"
        ),
        primary_key=True
    )

    role_id=Column(
        Integer,
        ForeignKey(
            "Roles.id"
        ),
        primary_key=True
    )