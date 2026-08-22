# app/services/consumable_service.py

import os
from datetime import datetime
from app.models.consumable_model import Consumable
from app.models.consumable_transaction_model import ConsumableTransaction
from app.repository.consumable_repo import create_consumable_repo, create_consumable_txn_repo, get_consumable_transactions_repo, get_deleted_consumables_repo, soft_delete_consumable_repo
from app.repository.consumable_repo import get_all_consumables_repo,get_consumable_by_id_repo, update_consumable_repo
from app.services.activity_log_service import log_activity
from app.core.config import settings
UPLOAD_DIR = os.path.join(
    settings.UPLOAD_DIR,
    "consumables"
)


def create_consumable_service(db, data, file, user_id):

    image_url = None

    #  handle image
    if file:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file.filename)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        image_url = file_path

    #  core logic
    total_qty = data.quantity
    remaining_qty = data.quantity

    total_cost = None
    if data.unit_cost:
        total_cost = data.unit_cost * data.quantity

    consumable = Consumable(
        name=data.name,
        image_url=image_url,

        company_id=data.company_id,
        category_id=data.category_id,
        supplier_id=data.supplier_id,
        manufacturer_id=data.manufacturer_id,
        location_id=data.location_id,

        model_no=data.model_no,
        item_no=data.item_no,
        order_number=data.order_number,

        purchase_date=data.purchase_date,

        unit_cost=data.unit_cost,
        total_cost=total_cost,

        total_qty=total_qty,
        remaining_qty=remaining_qty,
        min_qty=data.min_qty,

        notes=data.notes,

        created_by=user_id,
        created_at=datetime.utcnow()
    )

    create_consumable_repo(
    db,
    consumable
    )

    log_activity(
        db=db,
        created_by=user_id,
        module="CONSUMABLE",
        action="CREATE",
        item_type="CONSUMABLE",
        item_id=consumable.consumable_id,
        item_name=consumable.name,
        quantity=consumable.total_qty,
        notes="Consumable created"
    )

    db.commit()

    db.refresh(consumable)

    return consumable






def fetch_all_consumables_service(db):
    data = get_all_consumables_repo(db)

    return data
    
    



def update_consumable_service(db, consumable_id, data, file,user_id):

    consumable = get_consumable_by_id_repo(db, consumable_id)

    if not consumable:
        raise Exception("Consumable not found")

    #  Handle quantity safely
    if data.quantity is not None:
        if data.quantity < (consumable.total_qty - consumable.remaining_qty):
            raise Exception("Cannot reduce below already consumed quantity")

        difference = data.quantity - consumable.total_qty
        consumable.total_qty = data.quantity
        consumable.remaining_qty += difference

    #  Update fields dynamically
    update_data = data.dict(exclude_unset=True)

    for field, value in update_data.items():
        if field != "quantity":
            setattr(consumable, field, value)

    #  Recalculate total cost
    if consumable.unit_cost and consumable.total_qty:
        consumable.total_cost = consumable.unit_cost * consumable.total_qty

    #  Image replace
    if file:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file.filename)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        consumable.image_url = file_path


    update_consumable_repo(db, consumable)

    log_activity(
    db=db,
    created_by=user_id,
    module="CONSUMABLE",
    action="UPDATE",
    item_type="CONSUMABLE",
    item_id=consumable.consumable_id,
    item_name=consumable.name,
    quantity=consumable.total_qty,
    notes="Consumable updated"
    )
    db.commit()

    db.refresh(consumable)

    return consumable



def delete_consumable_service(db, consumable_id,user_id):

    consumable = get_consumable_by_id_repo(db, consumable_id)

    if not consumable:
        raise Exception("Consumable not found")

    deleted_consumable = soft_delete_consumable_repo(db,consumable) 
    log_activity(
    db=db,
    created_by=user_id,
    module="CONSUMABLE",
    action="DELETE",
    item_type="CONSUMABLE",
    item_id=consumable.consumable_id,
    item_name=consumable.name,
    notes="Consumable deleted"
    )

    db.commit()
    return deleted_consumable



def consume_consumable_service(db, data, performed_by):

    consumable = get_consumable_by_id_repo(db, data.consumable_id)

    if not consumable:
        raise Exception("Consumable not found")

    if data.quantity <= 0:
        raise Exception("Quantity must be greater than 0")

    if consumable.remaining_qty < data.quantity:
        raise Exception("Not enough stock")

    #  reduce stock
    consumable.remaining_qty -= data.quantity

    update_consumable_repo(db, consumable)

    #  log transaction
    txn = ConsumableTransaction(
        consumable_id=data.consumable_id,
        user_id=data.user_id,
        quantity=data.quantity,
        action="consume",
        notes=data.notes,
        created_by=performed_by,
        created_at=datetime.utcnow()
    )

    create_consumable_txn_repo(db, txn)
    log_activity(
    db=db,
    created_by=performed_by,
    module="CONSUMABLE",
    action="CONSUME",
    item_type="CONSUMABLE",
    item_id=consumable.consumable_id,
    item_name=consumable.name,
    target_user_id=data.user_id,
    quantity=data.quantity,
    notes=data.notes
)
    db.commit()

    return {
        "message": "Consumable issued successfully",
        "remaining_qty": consumable.remaining_qty
    }
    
    
    
    
def fetch_deleted_consumables_service(db):
    data = get_deleted_consumables_repo(db)

    return {
        "count": len(data),
        "items": data
    }
    
    



def add_stock_consumable_service(db, data, performed_by):

    consumable = get_consumable_by_id_repo(db, data.consumable_id)

    if not consumable:
        raise Exception("Consumable not found")

    if data.quantity <= 0:
        raise Exception("Quantity must be greater than 0")

    #  update stock
    consumable.remaining_qty += data.quantity
    consumable.total_qty += data.quantity

    update_consumable_repo(db, consumable)

    #  log transaction
    txn = ConsumableTransaction(
        consumable_id=data.consumable_id,
        user_id=None,  # not required for add stock
        quantity=data.quantity,
        action="add",
        notes=data.notes,
        created_by=performed_by,
        created_at=datetime.utcnow()
    )


    create_consumable_txn_repo(db, txn)

    log_activity(
    db=db,
    created_by=performed_by,
    module="CONSUMABLE",
    action="ADD_STOCK",
    item_type="CONSUMABLE",
    item_id=consumable.consumable_id,
    item_name=consumable.name,
    quantity=data.quantity,
    notes=data.notes
    )

    db.commit()

    return {
    "message": "Stock added successfully",
    "total_qty": consumable.total_qty,
    "remaining_qty": consumable.remaining_qty
    }
    
def get_consumable_transactions_service(db, consumable_id: int):
    rows = get_consumable_transactions_repo(db, consumable_id)

    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "quantity": row.quantity,
            "action": row.action,  # "consume" or "add"
            "notes": row.notes,
            "created_at": row.created_at
        }
        for row in rows
    ]