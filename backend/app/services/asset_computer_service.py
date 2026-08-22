# services/asset_computer_service.py

from fastapi import HTTPException

from app.models.asset_computer_model import AssetComputerDetails
from app.repository.asset_computer_repo import (
    bulk_delete_asset_repo,
    get_company_assets_repo,
    get_client_assets_repo,
    save_asset_computer_repo,
    delete_asset_computer_repo,
    get_asset_computer_by_id_repo,
    get_asset_computers_repo,
    get_deleted_asset_computer_by_id_repo,
    restore_asset_computer_repo,
    get_deleted_asset_computers_repo,
    permanently_delete_asset_computer_repo
)

from app.utils.assset_credential_crypto import (
    encrypt_password,
    decrypt_password,
    mask_password
)




from app.services.activity_log_service import (
    log_activity
)


def create_asset_computer_service(db, payload,current_user):

    data = payload.model_dump()

    if data.get("administrator_password"):
        data["administrator_password"] = encrypt_password(
            data["administrator_password"]
        )

    if data.get("email_password"):
        data["email_password"] = encrypt_password(
            data["email_password"]
        )

    obj = AssetComputerDetails(
        **data
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)
    log_activity(
        db=db,
        created_by=current_user.id,
        module="COMPUTER_ASSET",
        action="CREATE",
        item_type="COMPUTER_ASSET",
        item_id=obj.computer_detail_id,
        item_name=obj.pc_name,
        notes=f"Created computer asset '{obj.pc_name}' with Asset No '{obj.asset_no}'."
    )

    return obj





def get_asset_computers_service(db):
    assets = get_asset_computers_repo(db)

    for asset in assets:
        asset.administrator_password = mask_password(
            decrypt_password(
            asset.administrator_password
        )
        )

        # asset.administrator_password = (
        #     mask_password(
        #         password
        #     )
        # )
        asset.email_password = mask_password(
            decrypt_password(
            asset.email_password
        )
)

    return assets


def get_asset_computer_by_id_service(
db,
computer_detail_id: int
):
    asset = get_asset_computer_by_id_repo(
    db,
    computer_detail_id
    )

    
    if not asset:
        raise Exception("Computer asset not found")

    return asset

    


def get_company_assets_service(db):
    return get_company_assets_repo(db)


def get_client_assets_service(db):
    return get_client_assets_repo(db)



def get_deleted_asset_computers_service(db):
    return get_deleted_asset_computers_repo(db)

def update_asset_computer_service(
    db,
    computer_detail_id,
    payload,
    current_user
):
    asset = get_asset_computer_by_id_repo(
        db,
        computer_detail_id
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Computer asset not found."
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )
    

    # if (
    #     "administrator_password" in update_data
    #     and update_data["administrator_password"]
    # ):
    #     update_data["administrator_password"] = encrypt_password(
    #         update_data["administrator_password"]
    #     )

    if (
    "administrator_password" in update_data
    and update_data["administrator_password"]
    ):
        password = update_data["administrator_password"]

        # Ignore masked password from frontend
        if "*" in password:
            update_data.pop("administrator_password")
        else:
            update_data["administrator_password"] = encrypt_password(
                password
            )

    if (
    "email_password" in update_data
    and update_data["email_password"]
    ):
        password = update_data["email_password"]

        if "*" in password:
            update_data.pop("email_password")
        else:
            update_data["email_password"] = encrypt_password(
                password
            )

    changed_fields = []
    for key, value in update_data.items():
        old_value = getattr(asset, key)
     
        if old_value != value:
            changed_fields.append(key)

    for key, value in update_data.items():
        setattr(asset, key, value)

    asset= save_asset_computer_repo(
        db,
        asset
    )
    log_activity(
        db=db,
        created_by=current_user.id,
        module="COMPUTER_ASSET",
        action="UPDATE",
        item_type="COMPUTER_ASSET",
        item_id=asset.computer_detail_id,
        item_name=asset.pc_name,
        notes=(
        f"Updated computer asset '{asset.pc_name}' "
        f"(Asset No: {asset.asset_no}). "
        f"Fields changed: {', '.join(changed_fields)}."
    )
    )

    return asset



def delete_asset_computer_service(
    db,
    computer_detail_id,
    current_user
):
    asset = get_asset_computer_by_id_repo(
        db,
        computer_detail_id
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Computer asset not found."
        )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="COMPUTER_ASSET",
        action="DELETE",
        item_type="COMPUTER_ASSET",
        item_id=asset.computer_detail_id,
        item_name=asset.pc_name,
        notes=f"Deleted computer asset '{asset.pc_name}' (Asset No: {asset.asset_no})."
    )

    delete_asset_computer_repo(
        db,
        asset
    )

    return {
        "message":
        "Computer asset deleted successfully."
    }

def bulk_delete_asset_service(
    db,
    ids: list[int],
    current_user
):
    count = bulk_delete_asset_repo(
        db,
        ids
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="COMPUTER_ASSET",
        action="BULK_DELETE",
        item_type="COMPUTER_ASSET",
        quantity=count,
        notes=f"Bulk deleted {count} computer asset(s). IDs: {', '.join(map(str, ids))}."
    )

    return {
        "message":
            f"{count} assets deleted successfully."
    }


def reveal_admin_password_service(
    db,
    computer_detail_id,
    user_id
):
    asset = get_asset_computer_by_id_repo(
        db,
        computer_detail_id
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Computer asset not found."
        )
    
    

    password = decrypt_password(
        asset.administrator_password
    )
    email_password = decrypt_password(
    asset.email_password
    )
 

    log_activity(
        db=db,
        created_by=user_id,
        module="COMPUTER_ASSET",
        action="VIEW_PASSWORD",
        item_type="COMPUTER_ASSET",
        item_id=asset.computer_detail_id,
        item_name=asset.pc_name,
        notes=(
    f"Viewed administrator and email passwords for "
    f"'{asset.pc_name}' (Asset No: {asset.asset_no})."
)
    )



    return {
        "computer_detail_id": asset.computer_detail_id,
        "pc_name": asset.pc_name,
        "administrator_password": password,
        "email_password": email_password
    }



def restore_asset_computer_service(
    db,
    computer_detail_id: int,
    current_user
):
    asset = get_deleted_asset_computer_by_id_repo(
        db,
        computer_detail_id
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Deleted computer asset not found."
        )

    restore_asset_computer_repo(
        db,
        asset
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="COMPUTER_ASSET",
        action="RESTORE",
        item_type="COMPUTER_ASSET",
        item_id=asset.computer_detail_id,
        item_name=asset.pc_name,
        notes=(
            f"Restored computer asset "
            f"'{asset.pc_name}' "
            f"(Asset No: {asset.asset_no})."
        )
    )

    return {
        "message": "Computer asset restored successfully.",
        "computer_detail_id": asset.computer_detail_id,
        "pc_name": asset.pc_name,
        "asset_no": asset.asset_no
    }


def permanently_delete_asset_computer_service(
    db,
    computer_detail_id: int,
    current_user
):
    asset = get_deleted_asset_computer_by_id_repo(
        db,
        computer_detail_id
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Deleted computer asset not found."
        )

    asset_name = asset.pc_name
    asset_no = asset.asset_no
    asset_id = asset.computer_detail_id

    permanently_delete_asset_computer_repo(
        db,
        asset
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="COMPUTER_ASSET",
        action="PERMANENT_DELETE",
        item_type="COMPUTER_ASSET",
        item_id=asset_id,
        item_name=asset_name,
        notes=(
            f"Permanently deleted computer asset "
            f"'{asset_name}' "
            f"(Asset No: {asset_no})."
        )
    )

    return {
        "message": "Computer asset permanently deleted.",
        "computer_detail_id": asset_id
    }