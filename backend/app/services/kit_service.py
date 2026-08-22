from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.kit_transaction_model import KitTransaction
from datetime import datetime
from app.services.activity_log_service import log_activity

from app.models.kit_model import Kit
from app.models.kit_transaction_model import KitTransaction
from app.models.master_model import Status
from app.repository.kit_repo import (
    create_kit,
    get_all_kits,
    get_kit_by_id,
    add_item_to_kit,
    get_kit_items,
    get_existing_item,
    create_kit_transaction,
    create_transaction_item,
    get_transaction_items,
    update_kit,
    delete_kit,
    get_kit_item_by_id,
    delete_kit_item
)



from app.models.asset_model import Asset
from app.models.accessories_model import Accessory
from app.models.component_model import Component
from app.models.consumable_model import Consumable


VALID_TYPES = ["asset", "accessory", "component", "consumable"]


# 🔹 Create Kit
def create_kit_service(
    db: Session,
    data,
    performed_by
):

    try:

        kit = create_kit(
            db=db,
            name=data.name,
            created_by=performed_by
        )

        log_activity(
            db=db,
            created_by=performed_by,
            module="KIT",
            action="CREATE",
            item_type="KIT",
            item_id=kit.id,
            item_name=kit.name,
            notes="Kit created"
        )

        db.commit()

        db.refresh(kit)

        return kit

    except Exception as e:
        db.rollback()
        raise e


# 🔹 Get All Kits
def get_kits_service(db: Session):
    return get_all_kits(db)


def update_kit_service(
    db: Session,
    kit_id: int,
    data,
    performed_by
):

    try:

        kit = get_kit_by_id(db, kit_id)

        if not kit:
            raise HTTPException(
                status_code=404,
                detail="Kit not found"
            )

        update_kit(
            db=db,
            kit=kit,
            data=data
        )

        log_activity(
            db=db,
            created_by=performed_by,
            module="KIT",
            action="UPDATE",
            item_type="KIT",
            item_id=kit.id,
            item_name=kit.name,
            notes="Kit updated"
        )

        db.commit()

        db.refresh(kit)

        return kit

    except Exception as e:
        db.rollback()
        raise e
    
    
    
def delete_kit_service(
    db: Session,
    kit_id: int,
    performed_by
):

    try:

        kit = get_kit_by_id(db, kit_id)

        if not kit:
            raise HTTPException(
                status_code=404,
                detail="Kit not found"
            )

        delete_kit(
            db=db,
            kit=kit
        )
        log_activity(
            db=db,
            created_by=performed_by,
            module="KIT",
            action="DELETE",
            item_type="KIT",
            item_id=kit.id,
            item_name=kit.name,
            notes="Kit deleted"
        )

        db.commit()

        return {
            "message": "Kit deleted successfully"
        }

    except Exception as e:
        db.rollback()
        raise e

# 🔹 Get Kit with Items
def get_kit_with_items_service(db: Session, kit_id: int):
    kit = get_kit_by_id(db, kit_id)

    if not kit:
        raise HTTPException(status_code=404, detail="Kit not found")

    items = get_kit_items(db, kit_id)

    return {
        "id": kit.id,
        "name": kit.name,
        "items": items
    }




# 🔹 Add Item to Kit (FINAL)
def add_item_service(db: Session, kit_id: int, data,performed_by):

    try:

        # 🔹 1. Validate kit exists
        kit = get_kit_by_id(db, kit_id)

        if not kit:
            raise HTTPException(
                status_code=404,
                detail="Kit not found"
            )

        # 🔹 2. Validate item_type
        if data.item_type not in VALID_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Invalid item_type"
            )

        # 🔹 3. Validate item exists
        if data.item_type == "asset":

            item_exists = db.query(Asset).filter(
                Asset.model_id == data.item_ref_id
            ).first()

        elif data.item_type == "accessory":

            item_exists = db.query(Accessory).filter(
                Accessory.accessory_id == data.item_ref_id
            ).first()

        elif data.item_type == "component":

            item_exists = db.query(Component).filter(
                Component.id == data.item_ref_id
            ).first()

        elif data.item_type == "consumable":

            item_exists = db.query(Consumable).filter(
                Consumable.consumable_id == data.item_ref_id
            ).first()

        if not item_exists:
            raise HTTPException(
                status_code=404,
                detail=f"{data.item_type} not found"
            )

        # 🔹 4. Prevent duplicate
        existing = get_existing_item(
            db,
            kit_id,
            data.item_type,
            data.item_ref_id
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Item already exists in this kit"
            )

        #  5. Add item
        kit_item = add_item_to_kit(
            db,
            kit_id,
            data
        )

        log_activity(
            db=db,
            created_by=performed_by,
            module="KIT",
            action="ADD_ITEM",
            item_type="KIT",
            item_id=kit.id,
            item_name=kit.name,
            quantity=data.quantity,
            notes=f"Added {data.quantity} {data.item_type}"
        )

      
        #  6. Commit
        db.commit()

        # 7. Refresh
        db.refresh(kit_item)

        return kit_item

    except Exception as e:
        db.rollback()
        raise e



def get_active_transactions_service(db):

    transactions = db.query(
        KitTransaction,
        Kit
        ).join(
        Kit,
        Kit.id == KitTransaction.kit_id
    ).filter(
        KitTransaction.is_checked_in == False
    ).all()

    result = []

    for tx, kit in transactions:

        result.append({
            "transaction_id": tx.id,
            "kit_name": kit.name,
            "user_id": tx.user_id,
            "checkout_date": tx.checkout_date
        })

    return result



def checkout_kit_service(db: Session, kit_id: int, data,performed_by):

    try:
        # 🔹 1. Validate kit
        kit = get_kit_by_id(db, kit_id)

        if not kit:
            raise HTTPException(
                status_code=404,
                detail="Kit not found"
            )
            
        
        #  Prevent multiple active checkouts
        active_transaction = db.query(KitTransaction).filter(
            KitTransaction.kit_id == kit_id,
            KitTransaction.is_checked_in == False
        ).first()

        if active_transaction:
            raise HTTPException(
                status_code=400,
                detail="Kit already checked out"
            )


        # 🔹 2. Get kit items
        items = get_kit_items(db, kit_id)

        if not items:
            raise HTTPException(
                status_code=400,
                detail="Kit has no items"
            )

        # 🔹 3. Fetch statuses
        available_status = db.query(Status).filter(
            func.lower(Status.name) == "ready to deploy"
        ).first()

        assigned_status = db.query(Status).filter(
            func.lower(Status.name) == "deployed"
        ).first()

        if not available_status or not assigned_status:
            raise HTTPException(
                status_code=500,
                detail="Status configuration missing"
            )
        
        # ADD DEBUG HERE
        print("KIT:", kit)
        print("ITEMS:", items)
        print("AVAILABLE:", available_status)
        print("ASSIGNED:", assigned_status)


            
        # Remove timezone for SQL Server compatibility
        if data.checkout_date and data.checkout_date.tzinfo:
            data.checkout_date = data.checkout_date.replace(tzinfo=None)

        if data.expected_checkin_date and data.expected_checkin_date.tzinfo:
            data.expected_checkin_date = data.expected_checkin_date.replace(tzinfo=None)

        #  4. Create transaction FIRST
        tx = create_kit_transaction(
            db=db,
            kit_id=kit_id,
            data=data
        )

        db.flush()

        #  5. Process items
        for item in items:
            print(
            "PROCESSING:",
            item.item_type,
            item.item_ref_id,
            item.quantity
            )

            # ================= ASSET =================
            if item.item_type == "asset":

                assets = db.query(Asset).filter(
                    Asset.model_id == item.item_ref_id,
                    Asset.status_id == available_status.status_id,
                    Asset.is_deleted == False
                ).limit(item.quantity).all()

                if len(assets) < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough assets available for model {item.item_ref_id}"
                    )

                for asset in assets:

                    asset.checked_out_to = data.user_id
                    asset.status_id = assigned_status.status_id
                    asset.expected_checkin_date = data.expected_checkin_date

                    #  Save actual assigned asset
                    create_transaction_item(
                        db=db,
                        transaction_id=tx.id,
                        item_type="asset",
                        item_ref_id=item.item_ref_id,
                        actual_asset_id=asset.asset_id,
                        quantity=1
                    )

            # ================= ACCESSORY =================
            elif item.item_type == "accessory":

                accessory = db.query(Accessory).filter(
                    Accessory.accessory_id == item.item_ref_id
                ).first()

                if not accessory:
                    raise HTTPException(
                        status_code=404,
                        detail="Accessory not found"
                    )

                if accessory.available_qty < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough accessory stock (ID: {item.item_ref_id})"
                    )

                accessory.available_qty -= item.quantity
                accessory.checked_out_qty += item.quantity

                create_transaction_item(
                    db=db,
                    transaction_id=tx.id,
                    item_type="accessory",
                    item_ref_id=item.item_ref_id,
                    quantity=item.quantity
                )

            # ================= COMPONENT =================
            elif item.item_type == "component":

                component = db.query(Component).filter(
                    Component.id == item.item_ref_id
                ).first()

                if not component:
                    raise HTTPException(
                        status_code=404,
                        detail="Component not found"
                    )

                if component.remaining_qty < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough component stock (ID: {item.item_ref_id})"
                    )

                component.remaining_qty -= item.quantity

                create_transaction_item(
                    db=db,
                    transaction_id=tx.id,
                    item_type="component",
                    item_ref_id=item.item_ref_id,
                    quantity=item.quantity
                )

            # ================= CONSUMABLE =================
            elif item.item_type == "consumable":

                print(
                    "LOOKING FOR CONSUMABLE:",
                    item.item_ref_id
                )

                consumable = db.query(Consumable).filter(
                    Consumable.consumable_id == item.item_ref_id
                ).first()

                print(
                    "FOUND CONSUMABLE:",
                    consumable
                )

                if not consumable:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Consumable {item.item_ref_id} not found"
                    )

                if consumable.total_qty < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough consumable stock (ID: {item.item_ref_id})"
                    )

                consumable.total_qty -= item.quantity

                create_transaction_item(
                    db=db,
                    transaction_id=tx.id,
                    item_type="consumable",
                    item_ref_id=item.item_ref_id,
                    quantity=item.quantity
                )

        log_activity(
            db=db,
            created_by=performed_by,
            module="KIT",
            action="CHECKOUT",
            item_type="KIT",
            item_id=kit.id,
            item_name=kit.name,
            target_user_id=data.user_id,
            quantity=1,
            notes=data.notes
        )

        

        #  FINAL COMMIT
        db.commit()

        db.refresh(tx)

        return {
            "message": "Kit checked out successfully",
            "transaction_id": tx.id
        }

    except Exception as e:
        db.rollback()
        raise e
    
    
def checkin_kit_service(db: Session, transaction_id: int,performed_by):

    try:
        
                #  Get transaction
        transaction = db.query(KitTransaction).filter(
            KitTransaction.id == transaction_id
        ).first()

        if not transaction:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found"
            )
        
        kit = get_kit_by_id(db, transaction.kit_id)

        #  Prevent multiple checkins
        if transaction.is_checked_in:
            raise HTTPException(
                status_code=400,
                detail="Kit already checked in"
            )

        #  1. Get transaction items
        items = get_transaction_items(db, transaction_id)

        if not items:
            raise HTTPException(
                status_code=404,
                detail="Transaction items not found"
            )

        # 🔹 2. Get available status
        available_status = db.query(Status).filter(
            func.lower(Status.name) == "ready to deploy"
        ).first()

        if not available_status:
            raise HTTPException(
                status_code=500,
                detail="Available status missing"
            )

        #  3. Reverse items
        for item in items:

            # ================= ASSET =================
            if item.item_type == "asset":

                asset = db.query(Asset).filter(
                    Asset.asset_id == item.actual_asset_id
                ).first()

                if asset:

                    asset.checked_out_to = None
                    asset.status_id = available_status.status_id
                    asset.expected_checkin_date = None

            # ================= ACCESSORY =================
            elif item.item_type == "accessory":

                accessory = db.query(Accessory).filter(
                    Accessory.accessory_id == item.item_ref_id
                ).first()

                if accessory:
                    accessory.available_qty += item.quantity
                    accessory.checked_out_qty -= item.quantity

            # ================= COMPONENT =================
            elif item.item_type == "component":

                component = db.query(Component).filter(
                    Component.id == item.item_ref_id
                ).first()

                if component:
                    component.remaining_qty += item.quantity

            # ================= CONSUMABLE =================
            # Usually consumables are NOT restored
            elif item.item_type == "consumable":
                pass
        
        
         #  Mark transaction checked in
        transaction.is_checked_in = True
        transaction.checked_in_at = datetime.utcnow()

        log_activity(
            db=db,
            created_by=performed_by,
            module="KIT",
            action="CHECKIN",
            item_type="KIT",
            item_id=transaction.kit_id,
            item_name=kit.name,
            target_user_id=transaction.user_id,
            quantity=1,
            notes="Kit checked in"
        )
        #  Commit all changes
        db.commit()

        return {
            "message": "Kit checked in successfully"
        }

    except Exception as e:
        db.rollback()
        raise e
    
    
    
def update_kit_item_service(
    db: Session,
    item_id: int,
    data,
    performed_by
):

    try:

        item = get_kit_item_by_id(db, item_id)

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Kit item not found"
            )

        # Update quantity
        item.quantity = data.quantity

        log_activity(
            db=db,
            created_by=performed_by,
            module="KIT",
            action="UPDATE_ITEM",
            item_type="KIT",
            item_id=item.kit_id,
            item_name="Kit item updated",
            quantity=data.quantity
        )

        db.commit()

        db.refresh(item)

        return item

    except Exception as e:
        db.rollback()
        raise e
    
    
def delete_kit_item_service(
    db: Session,
    item_id: int,
    performed_by
):

    try:

        item = get_kit_item_by_id(
            db,
            item_id
        )

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Kit item not found"
            )

        delete_kit_item(
            db,
            item
        )
        log_activity(
            db=db,
            created_by=performed_by,
            module="KIT",
            action="DELETE_ITEM",
            item_type="KIT",
            item_id=item.kit_id,
            item_name="Kit item removed"
        )

        db.commit()

        return {
            "message": "Kit item deleted successfully"
        }

    except Exception as e:
        db.rollback()
        raise e