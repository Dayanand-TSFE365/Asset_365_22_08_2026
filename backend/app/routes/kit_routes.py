from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.kit_schema import KitCheckout
from app.services.kit_service import checkin_kit_service, checkout_kit_service, delete_kit_service, get_active_transactions_service, update_kit_service
from app.schemas.kit_schema import KitUpdate,KitItemUpdate
from app.core.dependencies import get_current_user
from app.db.database import get_asset_db
from app.schemas.kit_schema import (
    KitCreate,
    KitResponse,
    KitItemCreate,
    KitWithItemsResponse
)
from app.services.kit_service import (
    create_kit_service,
    get_kits_service,
    add_item_service,
    get_kit_with_items_service,
    update_kit_item_service,
    delete_kit_item_service
)

router = APIRouter(prefix="/apiV3/kits", tags=["Kits"])


# 🔹 Create Kit
@router.post("/", response_model=KitResponse)
def create_kit(data: KitCreate, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return create_kit_service(db, data,current_user.id)


# 🔹 Get All Kits
@router.get("/", response_model=list[KitResponse])
def get_kits(db: Session = Depends(get_asset_db)):
    return get_kits_service(db)



@router.put("/{kit_id}", response_model=KitResponse)
def update_kit_name(
    kit_id: int,
    data: KitUpdate,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return update_kit_service(
        db,
        kit_id,
        data,
        current_user.id
    )

# 🔹 Add Item to Kit
@router.post("/{kit_id}/items")
def add_item(kit_id: int, data: KitItemCreate, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return add_item_service(db, kit_id, data,current_user.id)


@router.delete("/{kit_id}")
def remove_kit(
    kit_id: int,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return delete_kit_service(
        db,
        kit_id,
        current_user.id
    )


# 🔹 Get Kit with Items
@router.get("/{kit_id}", response_model=KitWithItemsResponse)
def get_kit(kit_id: int, db: Session = Depends(get_asset_db)):
    return get_kit_with_items_service(db, kit_id)



@router.post("/{kit_id}/checkout")
def checkout_kit(kit_id: int, data: KitCheckout, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return checkout_kit_service(db, kit_id, data,current_user.id)


@router.post("/transactions/{transaction_id}/checkin")
def checkin_kit(
    transaction_id: int,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return checkin_kit_service(db, transaction_id,current_user.id)


@router.get("/transactions/active")
def get_active_transactions(
    db: Session = Depends(get_asset_db)
):
    return get_active_transactions_service(db)



@router.put("/items/{item_id}")
def update_kit_item(
    item_id: int,
    data: KitItemUpdate,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return update_kit_item_service(
        db,
        item_id,
        data,
        current_user.id
    )
    
    
@router.delete("/items/{item_id}")
def remove_kit_item(
    item_id: int,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return delete_kit_item_service(
        db,
        item_id,
        current_user.id
    )