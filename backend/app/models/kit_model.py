from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint,Boolean
from sqlalchemy.sql import func
from app.db.database import AssetBase


class Kit(AssetBase):
    __tablename__ = "Kits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_by = Column(Integer, ForeignKey("AuthUsers.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_deleted = Column(Boolean, default=False)
    updated_at = Column(
    DateTime(timezone=True),
    server_default=func.now(),
    onupdate=func.now()
)


class KitItem(AssetBase):
    __tablename__ = "Kit_items"

    id = Column(Integer, primary_key=True, index=True)
    kit_id = Column(Integer, ForeignKey("Kits.id", ondelete="CASCADE"), nullable=False)

    item_type = Column(String(50), nullable=False)  # asset, accessory, component, consumable
    item_ref_id  = Column(Integer, nullable=False)
    quantity = Column(Integer, default=1)

    __table_args__ = (
        CheckConstraint(
            "item_type IN ('asset', 'accessory', 'component', 'consumable')",
            name="chk_item_type"
        ),
    )