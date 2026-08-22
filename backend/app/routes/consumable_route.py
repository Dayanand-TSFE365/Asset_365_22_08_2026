from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_asset_db
from app.services.consumable_service import (
consume_consumable_service, 
create_consumable_service,
delete_consumable_service,
fetch_all_consumables_service,
fetch_deleted_consumables_service,
get_consumable_transactions_service,
update_consumable_service,
add_stock_consumable_service
)

from app.schemas.consumable_schema import (
    ConsumableAddStock,
    ConsumableCreate,
    ConsumableResponse,
    ConsumableUpdate,
    ConsumableConsume
    )
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/apiV3", tags=["Consumables"])


@router.post("/consumables")
def create_consumable(

    name: str = Form(...),
    company_id: int = Form(None),
    category_id: int = Form(None),
    supplier_id: int = Form(None),
    manufacturer_id: int = Form(None),
    location_id: int = Form(None),

    model_no: str = Form(None),
    item_no: str = Form(None),
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

    data = ConsumableCreate(
        name=name,
        company_id=company_id,
        category_id=category_id,
        supplier_id=supplier_id,
        manufacturer_id=manufacturer_id,
        location_id=location_id,
        model_no=model_no,
        item_no=item_no,
        order_number=order_number,
        purchase_date=purchase_date,
        unit_cost=unit_cost,
        quantity=quantity,
        min_qty=min_qty,
        notes=notes
    )

    return create_consumable_service(db, data, file, current_user.id)






@router.get("/consumables",response_model=list[ConsumableResponse])
def get_all_consumables(
    db: Session = Depends(get_asset_db),
    
):
    return fetch_all_consumables_service(db)



@router.put("/consumables/{consumable_id}")
def update_consumable(
    consumable_id: int,

    name: str = Form(None),
    company_id: int = Form(None),
    category_id: int = Form(None),
    supplier_id: int = Form(None),
    manufacturer_id: int = Form(None),
    location_id: int = Form(None),

    model_no: str = Form(None),
    item_no: str = Form(None),
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

    data = ConsumableUpdate(
        name=name,
        company_id=company_id,
        category_id=category_id,
        supplier_id=supplier_id,
        manufacturer_id=manufacturer_id,
        location_id=location_id,
        model_no=model_no,
        item_no=item_no,
        order_number=order_number,
        purchase_date=purchase_date,
        unit_cost=unit_cost,
        quantity=quantity,
        min_qty=min_qty,
        notes=notes
    )

    return update_consumable_service(db, consumable_id, data, file,current_user.id)


@router.delete("/consumables/{consumable_id}")
def delete_consumable(
    consumable_id: int,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return delete_consumable_service(db, consumable_id,current_user.id)







@router.post("/consumables/consume")
def consume_consumable(
    data: ConsumableConsume,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return consume_consumable_service(
        db,
        data,
        current_user.id
    )
    
    

@router.get("/consumables/deleted")
def get_deleted_consumables(
    db: Session = Depends(get_asset_db)
):
    return fetch_deleted_consumables_service(db)






@router.post("/consumables/add-stock")
def add_stock_consumable(
    data: ConsumableAddStock,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return add_stock_consumable_service(
        db,
        data,
        current_user.id
    )
    
    
@router.get("/consumables/{consumable_id}/transactions")
def get_consumable_transactions(
    consumable_id: int,
    db: Session = Depends(get_asset_db)
):
    return get_consumable_transactions_service(db, consumable_id)