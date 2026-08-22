# app/services/accessory_service.py

from datetime import datetime
from app.models.accessories_model import Accessory
from app.repository.accessories_repo import (
    create_accessory_repo, 
    get_all_accessories_repo,
    get_accessory_by_id_repo,
    get_user_checked_out_qty_repo,
    update_accessory_repo,
    soft_delete_accessory_repo,
    get_deleted_accessories_repo,
    create_transaction_repo,
    get_accessory_transactions_repo 
   
)
from app.models.accessory_transaction_model import AccessoryTransaction
from app.services.activity_log_service import log_activity

from app.core.config import settings

import os

# UPLOAD_DIR = "uploads/accessories"

UPLOAD_DIR = os.path.join(
    settings.UPLOAD_DIR,
    "accessories"
)


def create_accessory_service(db, data, file, user_id):

    image_url = None

    #  handle image
    if file:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file.filename)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        image_url = file_path

    #  business logic
    total_qty = data.quantity
    available_qty = data.quantity
    checked_out_qty = 0

    total_cost = None
    if data.unit_cost:
        total_cost = data.unit_cost * data.quantity

    accessory = Accessory(
        name=data.name,
        image_url=image_url,

        company_id=data.company_id,
        category_id=data.category_id,
        supplier_id=data.supplier_id,
        manufacturer_id=data.manufacturer_id,
        location_id=data.location_id,

        model_no=data.model_no,
        order_number=data.order_number,

        purchase_date=data.purchase_date,

        unit_cost=data.unit_cost,
        total_cost=total_cost,

        total_qty=total_qty,
        available_qty=available_qty,
        checked_out_qty=checked_out_qty,
        min_qty=data.min_qty,

        notes=data.notes,

        created_by=user_id,
        created_at=datetime.utcnow()
    )

    create_accessory_repo(db, accessory)

    log_activity(
    db=db,
    created_by=user_id,
    module="ACCESSORY",
    action="CREATE",
    item_type="ACCESSORY",
    item_id=accessory.accessory_id,
    item_name=accessory.name,
    quantity=accessory.total_qty,
    notes="Accessory created"
    )

    db.commit()

    db.refresh(accessory)

    return accessory


def fetch_all_accessories_service(db):
    data = get_all_accessories_repo(db)

    return {
        "count": len(data),
        "items": data
    }
    
    
    
# def update_accessory_service(db, accessory_id, data, file):

#     accessory = get_accessory_by_id_repo(db, accessory_id)

#     if not accessory:
#         raise Exception("Accessory not found")

#     #  Handle quantity update safely
#     if data.quantity is not None:
#         if data.quantity < accessory.checked_out_qty:
#             raise Exception("Cannot reduce below checked-out quantity")

#         difference = data.quantity - accessory.total_qty
#         accessory.total_qty = data.quantity
#         accessory.available_qty += difference

#     #  Update fields dynamically
#     update_data = data.dict(exclude_unset=True)

#     for field, value in update_data.items():
#         if field != "quantity":
#             setattr(accessory, field, value)

#     #  Recalculate total cost
#     if accessory.unit_cost and accessory.total_qty:
#         accessory.total_cost = accessory.unit_cost * accessory.total_qty

#     #  Handle image replace
#     if file:
#         os.makedirs(UPLOAD_DIR, exist_ok=True)
#         file_path = os.path.join(UPLOAD_DIR, file.filename)

#         with open(file_path, "wb") as f:
#             f.write(file.file.read())

#         accessory.image_url = file_path

#     return update_accessory_repo(db, accessory)


def update_accessory_service(db,accessory_id,data,file,user_id):

    accessory = get_accessory_by_id_repo(db,accessory_id)

    if not accessory:
        raise Exception("Accessory not found")

    # Handle quantity update safely
    if data.quantity is not None:

        if data.quantity < accessory.checked_out_qty:
            raise Exception(
                "Cannot reduce below checked-out quantity"
            )

        difference = (
            data.quantity - accessory.total_qty
        )

        accessory.total_qty = data.quantity

        accessory.available_qty += difference

    # Update fields dynamically
    update_data = data.dict(
        exclude_unset=True
    )

    for field, value in update_data.items():

        if field != "quantity":
            setattr(accessory, field, value)

    # Recalculate total cost
    if accessory.unit_cost and accessory.total_qty:

        accessory.total_cost = (
            accessory.unit_cost *
            accessory.total_qty
        )

    # Handle image replace
    if file:

        os.makedirs(UPLOAD_DIR, exist_ok=True)

        file_path = os.path.join(
            UPLOAD_DIR,
            file.filename
        )

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        accessory.image_url = file_path

    update_accessory_repo(db, accessory)

    # ACTIVITY LOG
    log_activity(
        db=db,
        created_by=user_id,
        module="ACCESSORY",
        action="UPDATE",
        item_type="ACCESSORY",
        item_id=accessory.accessory_id,
        item_name=accessory.name,
        quantity=accessory.total_qty,
        notes="Accessory updated"
    )

    db.commit()

    db.refresh(accessory)

    return accessory


# def delete_accessory_service(db, accessory_id):

#     accessory = get_accessory_by_id_repo(db, accessory_id)

#     if not accessory:
#         raise Exception("Accessory not found")

#     # ❗ Important: prevent deleting active checked-out items
#     if accessory.checked_out_qty > 0:
#         raise Exception("Cannot delete accessory with checked-out items")

#     return soft_delete_accessory_repo(db, accessory)

def delete_accessory_service(
    db,
    accessory_id,
    user_id
):

    accessory = get_accessory_by_id_repo(
        db,
        accessory_id
    )

    if not accessory:
        raise Exception("Accessory not found")

    if accessory.checked_out_qty > 0:
        raise Exception(
            "Cannot delete accessory with checked-out items"
        )

    soft_delete_accessory_repo(
        db,
        accessory
    )

    # ACTIVITY LOG
    log_activity(
        db=db,
        created_by=user_id,
        module="ACCESSORY",
        action="DELETE",
        item_type="ACCESSORY",
        item_id=accessory.accessory_id,
        item_name=accessory.name,
        notes="Accessory deleted"
    )

    db.commit()

    return {
        "message": "Accessory deleted successfully"
    }



def fetch_deleted_accessories_service(db):
    data = get_deleted_accessories_repo(db)

    return {
        "count": len(data),
        "items": data
    }





def checkout_accessory_service(
    db,
    data,
    performed_by
):

    accessory = get_accessory_by_id_repo(
        db,
        data.accessory_id
    )

    if not accessory:
        raise Exception("Accessory not found")

    if data.quantity <= 0:
        raise Exception(
            "Quantity must be greater than 0"
        )

    if accessory.available_qty < data.quantity:
        raise Exception("Not enough stock")

    if accessory.available_qty < 0:
        raise Exception("Invalid quantity update")

    # update stock
    accessory.available_qty -= data.quantity
    accessory.checked_out_qty += data.quantity

    update_accessory_repo(
        db,
        accessory
    )

    # create transaction
    txn = AccessoryTransaction(
        accessory_id=data.accessory_id,
        user_id=data.user_id,
        quantity=data.quantity,
        action="checkout",
        notes=data.notes,
        created_at=datetime.utcnow()
    )

    create_transaction_repo(
        db,
        txn
    )

    # ACTIVITY LOG
    log_activity(
        db=db,
        created_by=performed_by,
        module="ACCESSORY",
        action="CHECKOUT",
        item_type="ACCESSORY",
        item_id=accessory.accessory_id,
        item_name=accessory.name,
        target_user_id=data.user_id,
        quantity=data.quantity,
        notes=data.notes
    )

    db.commit()

    return {
        "message": "Accessory checked out successfully",
        "accessory_id": accessory.accessory_id,
        "remaining": accessory.available_qty
    }
    
    
def checkin_accessory_service(
    db,
    data,
    performed_by
):

    accessory = get_accessory_by_id_repo(
        db,
        data.accessory_id
    )

    if not accessory:
        raise Exception("Accessory not found")

    if data.quantity <= 0:
        raise Exception(
            "Quantity must be greater than 0"
        )

    user_checked_out_qty = (
        get_user_checked_out_qty_repo(
            db,
            data.accessory_id,
            data.user_id
        )
    )

    if data.quantity > user_checked_out_qty:
        raise Exception(
            "User cannot checkin more than they checked out"
        )

    if accessory.checked_out_qty < data.quantity:
        raise Exception(
            "Check-in quantity exceeds total checked-out amount"
        )

    # update stock
    accessory.available_qty += data.quantity
    accessory.checked_out_qty -= data.quantity

    update_accessory_repo(
        db,
        accessory
    )

    # transaction log
    txn = AccessoryTransaction(
        accessory_id=data.accessory_id,
        user_id=data.user_id,
        quantity=data.quantity,
        action="checkin",
        notes=data.notes,
        created_at=datetime.utcnow()
    )

    create_transaction_repo(
        db,
        txn
    )

    # ACTIVITY LOG
    log_activity(
        db=db,
        created_by=performed_by,
        module="ACCESSORY",
        action="CHECKIN",
        item_type="ACCESSORY",
        item_id=accessory.accessory_id,
        item_name=accessory.name,
        target_user_id=data.user_id,
        quantity=data.quantity,
        notes=data.notes
    )

    db.commit()

    return {
        "message": "Accessory checked in successfully",
        "accessory_id": accessory.accessory_id,
        "available": accessory.available_qty
    }




def get_accessory_transactions_service(db, accessory_id: int):
    rows = get_accessory_transactions_repo(db, accessory_id)

    return [
        {
            "user_id": row.user_id,
            "quantity": row.quantity,
            "last_activity": row.last_activity
        }
        for row in rows
    ]






