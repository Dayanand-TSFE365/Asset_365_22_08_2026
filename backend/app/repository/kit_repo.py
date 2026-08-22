from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.kit_model import Kit, KitItem
from app.models.kit_transaction_model import KitTransaction
from app.models.kit_transaction_item_model import KitTransactionItem


# 🔹 Create Kit
def create_kit(db: Session, name: str, created_by: int = None):

    kit = Kit(
        name=name,
        created_by=created_by
    )

    db.add(kit)

    return kit


# 🔹 Get All Kits
def get_all_kits(db: Session):
    return db.query(Kit).filter(
        Kit.is_deleted == False
    ).all()


# 🔹 Get Kit by ID
def get_kit_by_id(db: Session, kit_id: int):
    return db.query(Kit).filter(
        Kit.id == kit_id,
        Kit.is_deleted == False
    ).first()

def update_kit(db: Session, kit: Kit, data):

    kit.name = data.name

    return kit


def delete_kit(db: Session, kit: Kit):

    kit.is_deleted = True

    return kit

# 🔹 Add Item To Kit
def add_item_to_kit(db: Session, kit_id: int, data):

    item = KitItem(
        kit_id=kit_id,
        item_type=data.item_type,
        item_ref_id=data.item_ref_id,
        quantity=data.quantity
    )

    db.add(item)

    return item


# 🔹 Get Kit Items
def get_kit_items(db: Session, kit_id: int):

    return db.query(KitItem)\
        .filter(KitItem.kit_id == kit_id)\
        .order_by(KitItem.id.desc())\
        .all()


# 🔹 Prevent Duplicate
def get_existing_item(
    db: Session,
    kit_id: int,
    item_type: str,
    item_ref_id: int
):

    return db.query(KitItem).filter(
        KitItem.kit_id == kit_id,
        KitItem.item_type == item_type,
        KitItem.item_ref_id == item_ref_id
    ).first()


# 🔹 Create Checkout Transaction
def create_kit_transaction(db, kit_id, data):

    tx = KitTransaction(
        kit_id=kit_id,
        user_id=data.user_id,
        checkout_date=data.checkout_date,
        expected_checkin_date=data.expected_checkin_date,
        notes=data.notes
    )

    db.add(tx)

    return tx


# 🔹 Save Actual Assigned Items
def create_transaction_item(
    db,
    transaction_id,
    item_type,
    item_ref_id,
    quantity,
    actual_asset_id=None
):

    tx_item = KitTransactionItem(
        transaction_id=transaction_id,
        item_type=item_type,
        item_ref_id=item_ref_id,
        actual_asset_id=actual_asset_id,
        quantity=quantity
    )

    db.add(tx_item)

    return tx_item


# 🔹 Get Transaction Items
def get_transaction_items(db, transaction_id):

    return db.query(KitTransactionItem).filter(
        KitTransactionItem.transaction_id == transaction_id
    ).all()
    
    
    
def get_kit_item_by_id(db: Session, item_id: int):

    return db.query(KitItem).filter(
        KitItem.id == item_id
    ).first()
    
    
def delete_kit_item(db: Session, item: KitItem):

    db.delete(item)
    
    