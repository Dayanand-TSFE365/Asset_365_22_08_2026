# routes/client_license_route.py

from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_asset_db

from app.schemas.client_license_schema import (
BulkDeleteLicenseSchema,
CreateClientLicenseSchema,
LicenseTypeResponseSchema,
UpdateClientLicenseSchema
)

from app.services.client_license_service import (
bulk_delete_license_service,
create_client_license_service,
get_licenses_service,
get_license_types_service,
update_license_service,
delete_license_service,
reveal_product_key_service,
restore_license_service,
get_deleted_licenses_service,
permanently_delete_license_service
)

router = APIRouter(
prefix="/apiV3/Clientlicenses",
tags=["Client Licenses"]
)

@router.post("/")
def create_license(
payload: CreateClientLicenseSchema,
db: Session = Depends(get_asset_db),
current_user= Depends(get_current_user)
):
    return create_client_license_service(
    db,
    payload,
    current_user
    )

@router.get("/")
def get_licenses(
    db: Session = Depends(get_asset_db)
):
    return get_licenses_service(db)

@router.get(
    "/licence-type",
    response_model=list[LicenseTypeResponseSchema]
)
def get_license_types(
    db: Session = Depends(get_asset_db)
):
    return get_license_types_service(db)



@router.delete("/action/bulk-delete")
def bulk_delete_licenses(
    payload: BulkDeleteLicenseSchema,
    db: Session = Depends(get_asset_db),
    current_user= Depends(get_current_user)
):
    return bulk_delete_license_service(
        db,
        payload.ids,
        current_user
    )


@router.get("/deleted")
def get_deleted_licenses(
    db: Session = Depends(get_asset_db),
    # current_user=Depends(get_current_user)
):
    try:
        return get_deleted_licenses_service(db)

    except HTTPException:  
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.delete(
    "/{license_id}/permanent"
)
def permanently_delete_license(
    license_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return permanently_delete_license_service(
            db=db,
            license_id=license_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.put("/{license_id}")
def update_license(
    license_id: int,
    payload: UpdateClientLicenseSchema,
    db: Session = Depends(get_asset_db),
    current_user= Depends(get_current_user)
):
    return update_license_service(
        db,
        license_id,
        payload,
        current_user
    )


@router.get("/{license_id}/reveal-product-key")
def reveal_product_key(
    license_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    return reveal_product_key_service(
        db=db,
        license_id=license_id,
        user_id=current_user.id
    )

@router.delete("/{license_id}")
def delete_license(
    license_id: int,
    db: Session = Depends(get_asset_db),
    current_user= Depends(get_current_user)
):
    return delete_license_service(
        db,
        license_id,
        current_user
    )

@router.patch(
    "/{license_id}/restore"
)
def restore_license(
    license_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return restore_license_service(
            db=db,
            license_id=license_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
