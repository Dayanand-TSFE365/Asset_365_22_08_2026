from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_asset_db
from app.services.accessories_service import(
    create_accessory_service,
    fetch_all_accessories_service,
    delete_accessory_service, 
    checkout_accessory_service,
    checkin_accessory_service,
    fetch_deleted_accessories_service,
    get_accessory_transactions_service,
    update_accessory_service
)
from app.schemas.accessories_schema import AccessoryCreate,AccessoryUpdate
from app.core.dependencies import get_current_user
from app.schemas.accessories_schema import AccessoryCheckout
from app.schemas.accessories_schema import AccessoryCheckin

import json

router = APIRouter(prefix="/apiV3",tags=["Accessories"])

@router.post("/accessories")
def create_accessory(
    name: str = Form(...),
    company_id: int = Form(None),
    category_id: int = Form(None),
    supplier_id: int = Form(None),
    manufacturer_id: int = Form(None),
    location_id: int = Form(None),

    model_no: str = Form(None),
    order_number: str = Form(None),

    purchase_date: str = Form(None),

    unit_cost: float = Form(None),

    quantity: int = Form(...),
    min_qty: int = Form(0),

    notes: str = Form(None),

    file: UploadFile = File(None),

    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    data = AccessoryCreate(
        name=name,
        company_id=company_id,
        category_id=category_id,
        supplier_id=supplier_id,
        manufacturer_id=manufacturer_id,
        location_id=location_id,
        model_no=model_no,
        order_number=order_number,
        purchase_date=purchase_date,
        unit_cost=unit_cost,
        quantity=quantity,
        min_qty=min_qty,
        notes=notes
    )

    return create_accessory_service(db,data, file, current_user.id)


@router.get("/accessories")
def get_all_accessories(
    db: Session = Depends(get_asset_db)
):
    return fetch_all_accessories_service(db)





@router.post("/accessories/checkout")
def checkout_accessory(
    data: AccessoryCheckout,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return checkout_accessory_service(
        db,
        data,
        current_user.id
    )
    
    



@router.post("/accessories/checkin")
def checkin_accessory(
    data: AccessoryCheckin,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return checkin_accessory_service(
        db,
        data,
        current_user.id
    )
    
    
@router.put("/accessories/{accessory_id}")
def update_accessory(
    accessory_id: int,

    name: str = Form(None),
    company_id: int = Form(None),
    category_id: int = Form(None),
    supplier_id: int = Form(None),
    manufacturer_id: int = Form(None),
    location_id: int = Form(None),

    model_no: str = Form(None),
    order_number: str = Form(None),

    purchase_date: str = Form(None),

    unit_cost: float = Form(None),

    quantity: int = Form(None),
    min_qty: int = Form(None),

    notes: str = Form(None),

    file: UploadFile = File(None),

    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)

):
    data = AccessoryUpdate(
        name=name,
        company_id=company_id,
        category_id=category_id,
        supplier_id=supplier_id,
        manufacturer_id=manufacturer_id,
        location_id=location_id,
        model_no=model_no,
        order_number=order_number,
        purchase_date=purchase_date,
        unit_cost=unit_cost,
        quantity=quantity,
        min_qty=min_qty,
        notes=notes
    )

    return update_accessory_service(db, accessory_id, data, file,current_user.id)


@router.delete("/accessories/{accessory_id}")
def delete_accessory(
    accessory_id: int,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return delete_accessory_service(db, accessory_id,current_user.id)



@router.get("/accessories/deleted")
def get_deleted_accessories(
    db: Session = Depends(get_asset_db)
):
    return fetch_deleted_accessories_service(db)



@router.get("/accessories/{accessory_id}/transactions")
def get_accessory_transactions(
    accessory_id: int,
    db: Session = Depends(get_asset_db)
):
    return get_accessory_transactions_service(db, accessory_id)