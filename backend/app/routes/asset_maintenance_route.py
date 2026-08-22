from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.core.dependencies import (
    get_current_user
)

from app.schemas.asset_maintenance_schema import (

    AssetMaintenanceCreate,
    AssetMaintenanceUpdate,
    AssetMaintenanceResponse
)

from app.services.asset_maintenance_service import (

    create_asset_maintenance_service,

    get_all_maintenance_service,

    get_asset_maintenance_service,

    update_asset_maintenance_service,

    delete_asset_maintenance_service
)


router = APIRouter(

    prefix="/apiV3/assets-maintenance",

    tags=["Asset Maintenance"]
)


# -----------------------------------
# CREATE
# -----------------------------------

@router.post(
    "/{asset_id}",
    response_model=AssetMaintenanceResponse
)
def create_maintenance(

    asset_id: int,

    data: AssetMaintenanceCreate,

    db: Session = Depends(get_asset_db),

    current_user = Depends(
        get_current_user
    )
):

    return create_asset_maintenance_service(

        db,
        asset_id,
        data,
        current_user.id
    )


# -----------------------------------
# GET ALL
# -----------------------------------

@router.get(
    "/",
    response_model=list[
        AssetMaintenanceResponse
    ]
)
def get_all_maintenance(

    db: Session = Depends(get_asset_db)
):

    return get_all_maintenance_service(
        db
    )


# -----------------------------------
# GET ASSET MAINTENANCE
# -----------------------------------

@router.get(
    "/asset/{asset_id}",
    response_model=list[
        AssetMaintenanceResponse
    ]
)
def get_asset_maintenance(

    asset_id: int,

    db: Session = Depends(get_asset_db)
):

    return get_asset_maintenance_service(
        db,
        asset_id
    )


# -----------------------------------
# UPDATE
# -----------------------------------

@router.put(
    "/{maintenance_id}",
    response_model=AssetMaintenanceResponse
)
def update_maintenance(

    maintenance_id: int,

    data: AssetMaintenanceUpdate,

    db: Session = Depends(get_asset_db),

    current_user = Depends(
        get_current_user
    )
):

    return update_asset_maintenance_service(

        db,
        maintenance_id,
        data,
        current_user.id
    )


# -----------------------------------
# DELETE
# -----------------------------------

@router.delete(
    "/{maintenance_id}"
)
def delete_maintenance(

    maintenance_id: int,

    db: Session = Depends(get_asset_db),

    current_user = Depends(
        get_current_user
    )
):

    return delete_asset_maintenance_service(

        db,
        maintenance_id,
        current_user.id
    )