from fastapi import HTTPException

from app.repository.permission_repository import (
    get_user_permissions_repo,
    get_permission_by_code_repo,
    create_permission_repo,
    get_all_permissions_repo,
    get_all_users_permissions_repo,
    get_user_permission_repo,
    assign_user_permission_repo,
    remove_user_permission_repo,
    get_user_direct_permissions_repo,
    
)
from app.services.activity_log_service import log_activity
from app.models.permission_model import Permission
from app.models.user_permission_model import UserPermission

def create_permission_service(
    db,
    data,
    performed_by
):

    # -----------------------------
    # CHECK EXISTING
    # -----------------------------

    existing_permission = (

        get_permission_by_code_repo(
            db,
            data.permission_code
        )
    )

    if existing_permission:

        raise HTTPException(

            status_code=400,

            detail=
            "Permission already exists"
        )

    # -----------------------------
    # CREATE PERMISSION
    # -----------------------------

    permission = Permission(

        permission_code=
        data.permission_code,

        module_name=
        data.module_name
    )

    permission = create_permission_repo(
        db,
        permission
    )

    log_activity(
    db=db,
    created_by=performed_by,
    module="PERMISSION",
    action="CREATE",
    item_type="PERMISSION",
    item_id=permission.id,
    item_name=permission.permission_code,
    notes=(
        f"Created permission "
        f"'{permission.permission_code}' "
        f"for module '{permission.module_name}'."
    )
    )

    db.commit()

    db.refresh(permission)

    return {

        "id": permission.id,

        "permission_code":
        permission.permission_code,

        "module_name":
        permission.module_name
    }
    
    


def get_all_permissions_service(db):

    permissions = (
        get_all_permissions_repo(db)
    )

    response = []

    for permission in permissions:

        response.append({

            "id": permission.id,

            "permission_code":
            permission.permission_code,

            "module_name":
            permission.module_name
        })

    return response

def get_user_permissions_service(
    db,
    user_id
):

    permissions=(
        get_user_permissions_repo(
            db,
            user_id
        )
    )

    return {
        "permissions":
        permissions
    }
    
    



def get_all_users_permissions_service(
    db
):

    return (
        get_all_users_permissions_repo(
            db
        )
    )
    



# ------------------------------------
# ASSIGN USER PERMISSION
# ------------------------------------

def assign_user_permission_service(
    db,
    data,
    performed_by
):

    existing = (

        get_user_permission_repo(

            db,

            data.user_id,

            data.permission_id
        )
    )

    if existing:

        raise HTTPException(

            status_code=400,

            detail=
            "Permission already assigned"
        )

    user_permission = UserPermission(

        user_id=data.user_id,

        permission_id=data.permission_id
    )

    user_permission = (

        assign_user_permission_repo(
            db,
            user_permission
        )
    )

    log_activity(
    db=db,
    created_by=performed_by,
    module="PERMISSION",
    action="ASSIGN_USER_PERMISSION",
    item_type="PERMISSION",
    item_id=data.permission_id,
    target_user_id=data.user_id,
    notes=(
        f"Assigned permission "
        # f"'{user_permission.permission.permission_code}' "
        f"to user ID {user_permission.user_id}."
    )
)  
    db.commit()

    return {

        "message":
        "Permission assigned successfully"
    }



# ------------------------------------
# REMOVE USER PERMISSION
# ------------------------------------

def remove_user_permission_service(
    db,
    data,
    performed_by
):

    

    remove_user_permission_repo(

        db,

        data.user_id,

        data.permission_id
    )

    log_activity(
    db=db,
    created_by=performed_by,
    module="PERMISSION",
    action="REMOVE_USER_PERMISSION",
    item_type="PERMISSION",
    item_id=data.permission_id,
    target_user_id=data.user_id,
        notes=(
        f"Removed permission "
        f"from user ID {data.user_id}."
    )
)
    db.commit()

    return {

        "message":
        "Permission removed successfully"
    }



# ------------------------------------
# GET USER DIRECT PERMISSIONS
# ------------------------------------

def get_user_direct_permissions_service(
    db,
    user_id
):

    permissions = (

        get_user_direct_permissions_repo(
            db,
            user_id
        )
    )

    response = []

    for p in permissions:

        response.append({

            "id": p.id,

            "permission_code":
            p.permission_code
        })

    return response