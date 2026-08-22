from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.db.database import get_asset_db
from app.models.auth_model import AuthUser
from app.services.license_service import (
    create_license_service,
    get_all_licenses_service,
    update_license_service,
    checkout_license_service,
    checkin_license_service,
    delete_license_service,
    get_deleted_licenses_service,
    reveal_product_key_service
)

from app.schemas.license_schema import(
    LicenseCreate, 
    LicenseResponse,
    LicenseCheckout,
    LicenseCheckin,
     LicenseUpdate
)
from app.core.dependencies import get_current_user
from app.core.admin_require import require_admin

 
    


router = APIRouter(prefix="/apiV3/licenses", tags=["Licenses"])


@router.post("/", response_model=LicenseResponse)
def create_license(
    data: LicenseCreate,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    user_id = current_user.id

    return create_license_service(db, data, user_id)


@router.get("/", response_model=List[LicenseResponse])
def get_licenses(db: Session = Depends(get_asset_db)):
    return get_all_licenses_service(db)


@router.put("/{license_id}", response_model=LicenseResponse)
def update_license(
    license_id: int,
    data: LicenseUpdate,
    db: Session = Depends(get_asset_db),
    current_user =  Depends(get_current_user)
):
    updated = update_license_service(db, license_id, data,current_user.id)

    if not updated:
        raise HTTPException(status_code=404, detail="License not found")

    return updated




@router.put("/{license_id}/checkout")
def checkout_license(
    license_id: int,
    data: LicenseCheckout,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    
    return checkout_license_service(db, license_id, data, current_user.id)


@router.put("/{license_id}/checkin")
def checkin_license(
    license_id: int,
    data: LicenseCheckin,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return checkin_license_service(db, license_id, data,current_user.id)
    
    


@router.delete("/{license_id}")
def delete_license(
    license_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):
    return delete_license_service(db, license_id,current_user.id)



@router.get("/deleted", response_model=List[LicenseResponse])
def get_deleted_licenses(db: Session = Depends(get_asset_db)):
    return get_deleted_licenses_service(db)


@router.get("/{license_id}/reveal-key")
def reveal_product_key(
    license_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(require_admin)
):
    return reveal_product_key_service(
        db,
        license_id,
        current_user.id
    )