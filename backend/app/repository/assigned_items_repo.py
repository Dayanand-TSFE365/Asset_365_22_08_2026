from sqlalchemy.orm import Session

from app.models.asset_model import Asset

from app.models.accessory_transaction_model import (
    AccessoryTransaction
)

from app.models.component_transaction_model import (
    ComponentTransaction
)

from app.models.consumable_transaction_model import (
    ConsumableTransaction
)

from app.models.license_model import License
from app.models.license_log_model import LicenseLog


# 🔹 GET ASSIGNED ASSETS
def get_assigned_assets(
    db: Session,
    user_id: int
):

    return (
        db.query(Asset)
        .filter(
            Asset.checked_out_to == user_id,
            Asset.is_deleted == False
        )
        .all()
    )


# 🔹 GET ASSIGNED ACCESSORIES
def get_assigned_accessories(
    db: Session,
    user_id: int
):

    return (
        db.query(AccessoryTransaction)
        .filter(
            AccessoryTransaction.user_id == user_id,
            AccessoryTransaction.action == "checkout"
        )
        .all()
    )


# 🔹 GET ASSIGNED COMPONENTS
def get_assigned_components(
    db: Session,
    user_id: int
):

    return (
        db.query(ComponentTransaction)
        .filter(
            ComponentTransaction.user_id == user_id,
            ComponentTransaction.type == "checkout"
        )
        .all()
    )


# 🔹 GET ASSIGNED CONSUMABLES
def get_assigned_consumables(
    db: Session,
    user_id: int
):

    return (
        db.query(ConsumableTransaction)
        .filter(
            ConsumableTransaction.user_id == user_id,
            ConsumableTransaction.action == "checkout"
        )
        .all()
    )


#  GET ASSIGNED LICENSES
def get_assigned_licenses(
    db: Session,
    user_id: int
):

    return (
        db.query(LicenseLog)
        .join(
            License,
            License.license_id ==
            LicenseLog.license_id
        )
        .filter(
            LicenseLog.user_id == user_id,
            LicenseLog.action == "checkout"
        )
        .all()
    )