from sqlalchemy import Column,Integer,String,DateTime
from datetime import datetime
from app.db.database import AssetBase


class Role(AssetBase):

    __tablename__="Roles"

    id=Column(Integer,primary_key=True)

    role_name=Column(String)

    description=Column(String)

    created_at=Column(
        DateTime,
        default=datetime.utcnow
    )