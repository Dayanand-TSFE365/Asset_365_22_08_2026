from fastapi import HTTPException
from app.repository.client_license_repository import (
    bulk_delete_license_repo,
    create_client_license_repo,
    get_licenses_repo,
    get_license_types_repo,
    save_license_repo,
    get_license_by_id_repo,
    soft_delete_license_repo,
    get_deleted_license_by_id_repo,
    restore_license_repo,
    get_deleted_licenses_repo,
    permanently_delete_license_repo
)

from app.services.activity_log_service import log_activity

from app.schemas.client_license_schema import (
    UpdateClientLicenseSchema
)

from app.utils.license_crypto import encrypt_key,decrypt_key,mask_key



def create_client_license_service(db, payload,current_user):
    
    if payload.product_key:
        payload.product_key = encrypt_key(
            payload.product_key
        )
    if payload.serial_number:
        payload.serial_number = encrypt_key(
            payload.serial_number
        )
    if payload.password:
        payload.password = encrypt_key(
            payload.password
        )
    
    
    # Rockwell License Validation

    if payload.license_type_id == 1:
        if not payload.serial_number:
            raise HTTPException(
                status_code=400,
                detail="Serial number is required for Rockwell license."
            )

        if not payload.expired_on:
            raise HTTPException(
                status_code=400,
                detail="Expiry date is required for Rockwell license."
            )

    # Excel and SQL License Validation
    elif payload.license_type_id in [ 3, 4]:
        if not payload.email_id:
            raise HTTPException(
                status_code=400,
                detail="Email ID is required."
            )

        if not payload.password:
            raise HTTPException(
                status_code=400,
                detail="Password is required."
            )

    # Common Validation
    if payload.supplier_id is None:
        raise HTTPException(
            status_code=400,
            detail="Supplier is required."
        )

    license= create_client_license_repo(
        db=db,
        payload=payload
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="LICENSE",
        action="CREATE",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.product_name,
        notes=(
            f"Created license '{license.product_name}' "
            f"for client '{license.client_name}'."
        )
    )
    return license


def get_licenses_service(db):

    licenses = get_licenses_repo(db)
    for license in licenses:
        license.product_key = mask_key(
            decrypt_key(
                license.product_key
            )
        )

        license.serial_number = mask_key(
            decrypt_key(
                license.serial_number
            )
        )

        license.password = mask_key(
            decrypt_key(
                license.password
            )
        )

    return licenses




def get_license_types_service(db):
    return get_license_types_repo(db)




def update_license_service(
    db,
    license_id: int,
    payload: UpdateClientLicenseSchema,
    current_user
):
    license = get_license_by_id_repo(
        db,
        license_id
    )

    if not license:
        raise HTTPException(
            status_code=404,
            detail="License not found."
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )
    changed_fields = []

    
    if (
    "product_key" in update_data
    and update_data["product_key"]
    ):
        key = update_data["product_key"]

        if "*" in key:
            # Frontend sent the masked value, ignore it
            update_data.pop("product_key")
        else:
            update_data["product_key"] = encrypt_key(key)
        
    if (
        "serial_number" in update_data
        and update_data["serial_number"]
    ):
        serial = update_data["serial_number"]

        if "*" in serial:
            update_data.pop("serial_number")
        else:
            update_data["serial_number"] = (
                encrypt_key(
                    serial
                )
            )

    if (
    "password" in update_data
    and update_data["password"]
    ):
        password = update_data["password"]

        if "*" in password:
            update_data.pop("password")
        else:
            update_data["password"] = encrypt_key(
                password
            )

    for key, value in update_data.items():
        old_value = getattr(license, key)
        
        if old_value != value:
            if key in [
                "product_key",
                "serial_number",
                "password"
                ]:
                changed_fields.append(f"{key}: [UPDATED]")
            else:
                changed_fields.append(
                f"{key}: '{old_value}' → '{value}'"
                )
    
        
    for key, value in update_data.items():
        setattr(license, key, value)

    
    license= save_license_repo(
        db,
        license
    )
    log_activity(
        db=db,
        created_by=current_user.id,
        module="LICENSE",
        action="UPDATE",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.product_name,
        notes=(
            f"Updated license '{license.product_name}'. "
            f"Changes: {', '.join(changed_fields)}."
        )
    )

    return license

def reveal_product_key_service(
    db,
    license_id,
    user_id
):
    license = get_license_by_id_repo(
        db,
        license_id
    )

    if not license:
        raise HTTPException(
            status_code=404,
            detail="License not found."
        )
    

    product_key = decrypt_key(
        license.product_key
    )

    serial_number = decrypt_key(
    license.serial_number
    )
    password = decrypt_key(
    license.password
    )

    log_activity(
        db=db,
        created_by=user_id,
        module="LICENSE",
        action="VIEW_PRODUCT_KEY",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.product_name,
        notes=(
        f"Viewed credentials for license "
        f"'{license.product_name}'."
)
    )

    db.commit()

    return {
        "license_id": license.license_id,
        "product_name": license.product_name,
        "product_key": product_key,
        "serial_number": serial_number,
        "password": password
    }


def delete_license_service(
    db,
    license_id: int,
    current_user
):
    license = get_license_by_id_repo(
        db,
        license_id
    )

    if not license:
        raise HTTPException(
            status_code=404,
            detail="License not found."
        )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="LICENSE",
        action="DELETE",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.product_name,
        notes=(
            f"Deleted license '{license.product_name}' "
            f"for client '{license.client_name}'."
        )
    )

    soft_delete_license_repo(
        db,
        license
    )

    return {
        "message":
        "License deleted successfully."
    }


def bulk_delete_license_service(
    db,
    ids: list[int],
    current_user
):
    count = bulk_delete_license_repo(
        db,
        ids
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="LICENSE",
        action="BULK_DELETE",
        item_type="LICENSE",
        quantity=count,
        notes=(
            f"Bulk deleted {count} license(s). "
            f"IDs: {', '.join(map(str, ids))}."
        ),
        changes={
            "license_ids": ids
        }
    )

    return {
        "message":
            f"{count} licenses deleted successfully."
    }


def restore_license_service(
    db,
    license_id: int,
    current_user
):
    license = get_deleted_license_by_id_repo(
        db,
        license_id
    )

    if not license:
        raise HTTPException(
            status_code=404,
            detail="Deleted license not found."
        )

    restore_license_repo(
        db,
        license
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="LICENSE",
        action="RESTORE",
        item_type="LICENSE",
        item_id=license.license_id,
        item_name=license.product_name,
        notes=(
            f"Restored license "
            f"'{license.product_name}' "
            f"for client '{license.client_name}'."
        )
    )

    db.commit()

    return {
        "message": "License restored successfully.",
        "license_id": license.license_id,
        "product_name": license.product_name
    }

def get_deleted_licenses_service(db):

    licenses = get_deleted_licenses_repo(db)

    for license in licenses:

        if license.product_key:
            license.product_key = mask_key(
                decrypt_key(
                    license.product_key
                )
            )

        if license.serial_number:
            license.serial_number = mask_key(
                decrypt_key(
                    license.serial_number
                )
            )

        if license.password:
            license.password = mask_key(
                decrypt_key(
                    license.password
                )
            )

    return licenses


def permanently_delete_license_service(
    db,
    license_id: int,
    current_user
):
    license = get_deleted_license_by_id_repo(
        db,
        license_id
    )

    if not license:
        raise HTTPException(
            status_code=404,
            detail="Deleted license not found."
        )

    license_name = license.product_name
    client_name = license.client_name
    deleted_license_id = license.license_id

    # --------------------------------
    # ACTIVITY LOG
    # --------------------------------

    log_activity(
        db=db,
        created_by=current_user.id,
        module="LICENSE",
        action="PERMANENT_DELETE",
        item_type="LICENSE",
        item_id=deleted_license_id,
        item_name=license_name,
        notes=(
            f"Permanently deleted license "
            f"'{license_name}' "
            f"for client '{client_name}'."
        )
    )

    # --------------------------------
    # PERMANENT DELETE
    # --------------------------------

    permanently_delete_license_repo(
        db,
        license
    )

    return {
        "message": "License permanently deleted successfully."
    }