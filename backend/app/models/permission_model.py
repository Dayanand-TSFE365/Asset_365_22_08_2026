from sqlalchemy import Column,Integer,String
from app.db.database import AssetBase


class Permission(AssetBase):

    __tablename__="Permissions"

    id=Column(
        Integer,
        primary_key=True
    )

    permission_code=Column(
        String
    )

    module_name=Column(
        String
    )