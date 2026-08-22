from fastapi import HTTPException
from app.models.asset_model import Asset
from app.models.asset_maintenance_model import (
    AssetMaintenance
)

from app.repository.asset_maintenance_repo import (
    create_maintenance,
    get_all_maintenance,
    get_maintenance_by_id,
    get_asset_maintenance,
    update_maintenance,
    delete_maintenance
)

from app.services.activity_log_service import (
    log_activity
)


# -----------------------------------
# CREATE MAINTENANCE
# -----------------------------------

def create_asset_maintenance_service(
    db,
    asset_id,
    data,
    user_id
):

    asset = db.query(Asset).filter(
        Asset.asset_id == asset_id
    ).first()

    if not asset:

        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    maintenance = AssetMaintenance(

        asset_id=asset_id,

        title=data.title,

        maintenance_type=
        data.maintenance_type,

        status=data.status,

        start_date=data.start_date,

        expected_completion_date=
        data.expected_completion_date,

        completion_date=
        data.completion_date,

        cost=data.cost,

        warranty=data.warranty,

        vendor=data.vendor,

        ticket_url=data.ticket_url,

        notes=data.notes,

        created_by=user_id
    )

    maintenance = create_maintenance(
        db,
        maintenance
    )

    # OPTIONAL:
    # Set asset under maintenance

    asset.condition = "under maintenance"

    log_activity(
        db=db,
        created_by=user_id,
        module="ASSET_MAINTENANCE",
        action="CREATE",
        item_type="ASSET",
        item_id=asset.asset_id,
        item_name=asset.asset_name,
        notes=f"Maintenance created: {data.title}"
    )

    db.commit()

    db.refresh(maintenance)

    return maintenance


# -----------------------------------
# GET ALL MAINTENANCE
# -----------------------------------

def get_all_maintenance_service(
    db
):

    return get_all_maintenance(db)


# -----------------------------------
# GET ASSET MAINTENANCE
# -----------------------------------

def get_asset_maintenance_service(
    db,
    asset_id
):

    asset = db.query(Asset).filter(
        Asset.asset_id == asset_id
    ).first()

    if not asset:

        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    return get_asset_maintenance(
        db,
        asset_id
    )


# -----------------------------------
# UPDATE MAINTENANCE
# -----------------------------------

def update_asset_maintenance_service(
    db,
    maintenance_id,
    data,
    user_id
):

    maintenance = get_maintenance_by_id(
        db,
        maintenance_id
    )

    if not maintenance:

        raise HTTPException(
            status_code=404,
            detail="Maintenance not found"
        )

    update_data = data.dict(
        exclude_unset=True
    )

    maintenance = update_maintenance(
        db,
        maintenance,
        update_data
    )

    # If completed -> restore condition
    if maintenance.status == "completed":

        asset = db.query(Asset).filter(
            Asset.asset_id
            == maintenance.asset_id
        ).first()

        if asset:

            asset.condition = "good"

    log_activity(
        db=db,
        created_by=user_id,
        module="ASSET_MAINTENANCE",
        action="UPDATE",
        item_type="ASSET",
        item_id=maintenance.asset_id,
        item_name=maintenance.title,
        notes="Maintenance updated"
    )

    db.commit()

    db.refresh(maintenance)

    return maintenance


# -----------------------------------
# DELETE MAINTENANCE
# -----------------------------------

def delete_asset_maintenance_service(
    db,
    maintenance_id,
    user_id
):

    maintenance = get_maintenance_by_id(
        db,
        maintenance_id
    )

    if not maintenance:

        raise HTTPException(
            status_code=404,
            detail="Maintenance not found"
        )

    delete_maintenance(
        db,
        maintenance
    )

    log_activity(
        db=db,
        created_by=user_id,
        module="ASSET_MAINTENANCE",
        action="DELETE",
        item_type="ASSET",
        item_id=maintenance.asset_id,
        item_name=maintenance.title,
        notes="Maintenance deleted"
    )

    db.commit()

    return {
        "message":
        "Maintenance deleted successfully"
    }