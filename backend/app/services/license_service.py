from app.models.license_model import License
from app.repository.license_repo import create_license as repo_create
from app.repository.license_repo import get_all_licenses
from app.repository.license_repo import checkout_license as repo_checkout
from app.repository.license_repo import update_license as repo_update
from app.repository.license_repo import checkin_license as repo_checkin
from app.repository.license_repo import soft_delete_license
from app.repository.license_repo import get_deleted_licenses
from app.services.activity_log_service import log_activity

from datetime import datetime
from app.utils.license_crypto import (
    encrypt_key,
    decrypt_key,
    mask_key
)

def create_license_service(db, data, user_id):
    encrypted_product_key = encrypt_key(
        data.product_key
        )
    license_data = {
        "Software_name": data.Software_name,
        
        "product_key": encrypted_product_key,

        "total": data.total,
        "available": data.total,  # IMPORTANT

        "min_qty": data.min_qty,

        "expiration_date": data.expiration_date,
        "termination_date": data.termination_date,

        "licensed_to": data.licensed_to,
        "licensed_to_email": data.licensed_to_email,

        "purchase_date": data.purchase_date,
        "purchase_cost": data.purchase_cost,
        "depreciation": data.depreciation,

        "maintained": data.maintained,
        "reassignable": data.reassignable,

        "order_number": data.order_number,
        "purchase_order_number": data.purchase_order_number,

        "notes": data.notes,

        "company_id": data.company_id,
        "supplier_id": data.supplier_id,
        "manufacturer_id": data.manufacturer_id,
        "category_id": data.category_id,

        "created_by": user_id,
        "created_at": datetime.utcnow()
    }

    new_license = repo_create(
    db,
    license_data
    )

    log_activity(
        db=db,
        created_by=user_id,
        module="LICENSE",
        action="CREATE",
        item_type="LICENSE",
        item_id=new_license.license_id,
        item_name=new_license.Software_name,
        quantity=new_license.total,
        notes="License created"
    )

    db.commit()

    db.refresh(new_license)

    return new_license






def get_all_licenses_service(db):

    licenses = db.query(
        License
    ).filter(
        License.is_deleted == False
    ).all()

    result = []

    for license in licenses:

        data = license.__dict__.copy()

        decrypted_key = decrypt_key(
            license.product_key
        )

        data["product_key"] = mask_key(
            decrypted_key
        )

        data.pop("_sa_instance_state", None)

        result.append(data)

    return result




def update_license_service(db, license_id, data, user_id):
    update_data = data.dict(exclude_unset=True)
    
    if ("product_key" in update_data and update_data["product_key"]):
        update_data["product_key"] = encrypt_key(
        update_data["product_key"]
        )

    license = repo_update(
        db,
        license_id,
        update_data
    )
    if not license:
        raise Exception("License not found")

    log_activity(
        db=db,
        created_by=user_id,
        module="LICENSE",
        action="UPDATE",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.Software_name,
        quantity=license.total,
        notes="License updated"
    )

    db.commit()

    db.refresh(license)

    return license




def checkout_license_service(
    db,
    license_id,
    data,
    user_id
):

    log = repo_checkout(
        db,
        license_id,
        data,
        user_id
    )

    license = db.query(License).filter(
        License.license_id == license_id
    ).first()

    log_activity(
        db=db,
        created_by=user_id,
        module="LICENSE",
        action="CHECKOUT",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.Software_name,
        target_user_id=data.user_id,
        quantity=1,
        notes=data.checkout_note
    )

    db.commit()

    return log



def checkin_license_service(db,license_id, data,performed_by):
    log = repo_checkin(
    db,
    license_id,
    data,
    performed_by
    )

    license = db.query(License).filter(
        License.license_id == license_id
    ).first()

    log_activity(
        db=db,
        created_by=performed_by,
        module="LICENSE",
        action="CHECKIN",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.Software_name,
        target_user_id=data.user_id,
        quantity=1,
        notes=data.checkin_note
    )

    db.commit()

    return log



def delete_license_service(
    db,
    license_id: int,
    user_id
):

    license = db.query(License).filter(
        License.license_id == license_id,
        License.is_deleted == False
    ).first()

    if not license:
        raise Exception("License not found")

    soft_delete_license(
        db,
        license_id
    )

    log_activity(
        db=db,
        created_by=user_id,
        module="LICENSE",
        action="DELETE",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.Software_name,
        notes="License deleted"
    )

    db.commit()

    return {
        "message": "License deleted successfully"
    }




def get_deleted_licenses_service(db):
    return get_deleted_licenses(db)


def reveal_product_key_service(
    db,
    license_id,
    user_id
):
    license = db.query(
        License
    ).filter(
        License.license_id == license_id
    ).first()

    if not license:
        raise Exception("License not found")

    

    product_key = decrypt_key(
        license.product_key
    )

    log_activity(
        db=db,
        created_by=user_id,
        module="LICENSE",
        action="VIEW_KEY",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.Software_name,
        notes="Product key viewed"
    )

    db.commit()

    return {
        "product_key": product_key
    }