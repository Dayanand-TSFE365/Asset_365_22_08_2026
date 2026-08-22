from app.models.asset_maintenance_model import (
    AssetMaintenance
)


# -----------------------------
# CREATE
# -----------------------------

def create_maintenance(
    db,
    maintenance
):

    db.add(maintenance)

    db.flush()

    db.refresh(maintenance)

    return maintenance


# -----------------------------
# GET ALL
# -----------------------------

def get_all_maintenance(
    db
):

    return (

        db.query(AssetMaintenance)

        .order_by(
            AssetMaintenance.created_at.desc()
        )

        .all()
    )


# -----------------------------
# GET BY ID
# -----------------------------

def get_maintenance_by_id(
    db,
    maintenance_id
):

    return (

        db.query(AssetMaintenance)

        .filter(
            AssetMaintenance.maintenance_id
            == maintenance_id
        )

        .first()
    )


# -----------------------------
# GET BY ASSET
# -----------------------------

def get_asset_maintenance(
    db,
    asset_id
):

    return (

        db.query(AssetMaintenance)

        .filter(
            AssetMaintenance.asset_id
            == asset_id
        )

        .order_by(
            AssetMaintenance.created_at.desc()
        )

        .all()
    )


# -----------------------------
# UPDATE
# -----------------------------

def update_maintenance(
    db,
    maintenance,
    data
):

    for key, value in data.items():

        setattr(
            maintenance,
            key,
            value
        )

    db.flush()

    db.refresh(maintenance)

    return maintenance


# -----------------------------
# DELETE
# -----------------------------

def delete_maintenance(
    db,
    maintenance
):

    db.delete(maintenance)

    db.flush()

    return True