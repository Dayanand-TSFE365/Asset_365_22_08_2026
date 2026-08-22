from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_asset_db
from app.schemas.asset_schema import CheckinRequest, CheckoutRequest
from app.services import asset_service
from app.services.asset_service import add_asset_with_image,fetch_assets, fetch_asset_by_id,update_asset
from app.schemas.asset_schema import AssetCreate, AssetUpdate, AssetResponse
from app.services.asset_service import delete_asset,fetch_deleted_assets
from app.schemas.asset_audit_schema import (
    AssetAuditResponse
)

from app.services.assets_audit_service import (
    get_asset_audit_history_service,
    get_all_asset_audits_service,
    
)
from app.services.assets_audit_service import (
    audit_asset as audit_asset_service
)

from app.core.dependencies import get_current_user

router = APIRouter(prefix="/apiV3/assets", tags=["Assets"])


@router.get("/",response_model=list[AssetResponse])
def get_assets(db: Session = Depends(get_asset_db)):
    
    return fetch_assets(db)

@router.get("/deleted", response_model=list[AssetResponse])
def get_deleted_assets(db: Session = Depends(get_asset_db)):
    return fetch_deleted_assets(db)





#  CLEAN CREATE API
@router.post("/upload")
async def create_asset(
    # 🔹 Basic
    asset_tag: str = Form(...),
    asset_name: str = Form(...),
    serial_number: str = Form(None),

    # 🔹 Relations
    company_id: int = Form(...),
    model_id: int = Form(...),
    status_id: int = Form(...),
    checked_out_to: int = Form(None),
    location_id: int = Form(None),
    supplier_id: int = Form(None),

    # 🔹 Financial
    purchase_cost: float = Form(None),
    current_value: float = Form(None),

    depreciation_months: int = Form(None),

    # 🔹 Dates
    purchase_date: str = Form(None),
    expected_checkin_date: str = Form(None),
    next_audit_date: str = Form(None),
    warranty_months: int = Form(None),
    warranty_expires: str = Form(None),
    eol_date: str = Form(None),

    # 🔹 Other
    order_number: str = Form(None),
    notes: str = Form(None),
    condition: str = Form(None),
    
    requestable: bool = Form(False),
    byod: bool = Form(False),
  

    # 🔹 File
    file: UploadFile = File(None),

    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    
    #  Convert into schema (important)
    data = AssetCreate(
        asset_tag=asset_tag,
        asset_name=asset_name,
        serial_number=serial_number,

        company_id=company_id,
        model_id=model_id,
        status_id=status_id,
        checked_out_to=checked_out_to,
        location_id=location_id,
        supplier_id=supplier_id,

        purchase_cost=purchase_cost,
        current_value=current_value,
        depreciation_months=depreciation_months,
        

        purchase_date=purchase_date,
        expected_checkin_date=expected_checkin_date,
        next_audit_date=next_audit_date,
        warranty_months=warranty_months,
        warranty_expires=warranty_expires,
        eol_date=eol_date,
        order_number=order_number,
        notes=notes,
        condition=condition,
        requestable=requestable,
        byod=byod
    )

    return await add_asset_with_image(db, data, file,current_user.id)








@router.delete("/{asset_id}")
def delete_asset_route(asset_id: int, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return delete_asset(db, asset_id,current_user.id)


@router.put("/{asset_id}/checkout",response_model=AssetResponse)
def checkout(asset_id: int, data: CheckoutRequest, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return asset_service.checkout_asset(db, asset_id, data,current_user.id)



@router.put("/{asset_id}/checkin", response_model=AssetResponse)
def checkin(asset_id: int, data: CheckinRequest, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return asset_service.checkin_asset(db, asset_id, data,current_user.id)




@router.get(
    "/audits",
    response_model=list[AssetAuditResponse]
)
def get_all_asset_audits(

    db: Session = Depends(get_asset_db),

    

):

    return get_all_asset_audits_service(db)

@router.get(
    "/{asset_id}/audits",
    response_model=list[AssetAuditResponse]
)
def get_asset_audits(

    asset_id: int,

    db: Session = Depends(get_asset_db),
    

):

    return get_asset_audit_history_service(
        db,
        asset_id
    )

@router.post("/{asset_id}/audit")
async def audit_asset(
    asset_id: int,

    location_id: int = Form(...),
    update_location: bool = Form(False),
    next_audit_date: str = Form(None),
    notes: str = Form(None),

    file: UploadFile = File(None),   #  image here

    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    print("AUDIT ROUTE HIT")
    return await audit_asset_service(
        db,
        asset_id,
        location_id,
        update_location,
        next_audit_date,
        notes,
        file,
        current_user.id 
    )


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset_route(asset_id: int, 
                       data: AssetUpdate, 
                       db: Session = Depends(get_asset_db),
                       current_user = Depends(get_current_user)):
    return update_asset(db, asset_id, data,current_user.id)


@router.get("/{asset_id}",response_model=AssetResponse)
def get_asset(asset_id: int, db: Session = Depends(get_asset_db)):
    return fetch_asset_by_id(db, asset_id)