# routes/asset_computer_route.py

from app.core.dependencies import get_current_user
from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.schemas.asset_computer_schema import (
    CreateAssetComputerSchema,
    AssetComputerResponseSchema,
    UpdateAssetComputerSchema,
    BulkDeleteAssetSchema
)

from app.services.asset_computer_service import (
    bulk_delete_asset_service,
    create_asset_computer_service,
    get_asset_computers_service,
    get_asset_computer_by_id_service,
    get_client_assets_service,
    get_company_assets_service,
    reveal_admin_password_service,
    update_asset_computer_service,
    delete_asset_computer_service,
    restore_asset_computer_service,
    get_deleted_asset_computers_service,
    permanently_delete_asset_computer_service
)

router = APIRouter(
    prefix="/apiV3/computer-assets",
    tags=["Computer Assets"]
)


@router.post("/")
def create_computer_asset(
    payload: CreateAssetComputerSchema,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return create_asset_computer_service(
        db,
        payload,
        current_user
    )

# routes/asset_computer_route.py
@router.get("/")
def get_computer_assets(
    db: Session = Depends(get_asset_db)
):
    return get_asset_computers_service(db)





@router.get(
    "/company",
    response_model=list[AssetComputerResponseSchema],
    response_model_exclude_none=True
)
def get_company_assets(
    db: Session = Depends(get_asset_db)
):
    return get_company_assets_service(db)


@router.get(
    "/client",
    response_model=list[AssetComputerResponseSchema],
    response_model_exclude_none=True
)
def get_client_assets(
    db: Session = Depends(get_asset_db)
):
    return get_client_assets_service(db)

@router.get(
    "/deleted"
)
def get_deleted_asset_computers(
    db: Session = Depends(get_asset_db),
    # current_user=Depends(get_current_user)
):
    try:
        return get_deleted_asset_computers_service(
            db
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.delete("/action/bulk-delete")
def bulk_delete_assets(
    payload: BulkDeleteAssetSchema,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return bulk_delete_asset_service(
        db,
        payload.ids,
        current_user
    )



@router.patch(
    "/{computer_detail_id}/restore"
)
def restore_asset_computer(
    computer_detail_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return restore_asset_computer_service(
            db=db,
            computer_detail_id=computer_detail_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



@router.delete(
    "/{computer_detail_id}/permanent"
)
def permanently_delete_asset_computer(
    computer_detail_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return permanently_delete_asset_computer_service(
            db=db,
            computer_detail_id=computer_detail_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get(
    "/{computer_detail_id}/reveal-password"
)
def reveal_admin_password(
    computer_detail_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    return reveal_admin_password_service(
        db=db,
        computer_detail_id=computer_detail_id,
        user_id=current_user.id
    )


@router.get("/{computer_detail_id}")
def get_computer_asset_by_id(
computer_detail_id: int,
db: Session = Depends(get_asset_db)
):
    return get_asset_computer_by_id_service(
    db,
    computer_detail_id
    )




@router.put("/{computer_detail_id}")
def update_computer_asset(
    computer_detail_id: int,
    payload: UpdateAssetComputerSchema,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return update_asset_computer_service(
        db,
        computer_detail_id,
        payload,
        current_user
    )


@router.delete("/{computer_detail_id}")
def delete_computer_asset(
    computer_detail_id: int,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return delete_asset_computer_service(
        db,
        computer_detail_id,
        current_user
    )










