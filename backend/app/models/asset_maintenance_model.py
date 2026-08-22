from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    DECIMAL,
    Boolean
)

from datetime import datetime

from app.db.database import AssetBase


class AssetMaintenance(AssetBase):

    __tablename__ = "AssetMaintenance"

    maintenance_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    asset_id = Column(
        Integer,
        ForeignKey("Assets.asset_id"),
        nullable=False
    )

    title = Column(String(255))

    maintenance_type = Column(String(100))
    # repair / inspection / upgrade

    status = Column(String(100))
    # pending / in_progress / completed

    start_date = Column(Date)

    expected_completion_date = Column(Date)

    completion_date = Column(Date)

    cost = Column(DECIMAL(12,2))

    warranty = Column(Boolean, default=False)

    vendor = Column(String(255))

    ticket_url = Column(String(500))

    notes = Column(String)

    created_by = Column(Integer)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )