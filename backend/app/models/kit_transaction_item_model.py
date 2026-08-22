from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.db.database import AssetBase


class KitTransactionItem(AssetBase):
    __tablename__ = "kit_transaction_items"

    id = Column(Integer, primary_key=True, index=True)

    transaction_id = Column(
        Integer,
        ForeignKey("kit_transactions.id"),
        nullable=False
    )

    item_type = Column(String(50), nullable=False)

    item_ref_id = Column(Integer, nullable=False)

    actual_asset_id = Column(Integer, nullable=True)

    quantity = Column(Integer, default=1)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )