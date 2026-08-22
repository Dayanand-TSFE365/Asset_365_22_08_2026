from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.core.admin_require import (
    require_admin
)

from app.schemas.group_schema import (

    CreateGroupRequest,

    AssignUserGroupRequest,

    RemoveUserGroupRequest,

    AssignGroupPermissionRequest,

    RemoveGroupPermissionRequest
)

from app.services.group_service import (

    create_group_service,
    delete_group_service,
    get_all_groups_service,
    assign_user_group_service,
    get_group_users_service,
    remove_user_group_service,
    assign_group_permission_service,

    remove_group_permission_service,

    get_group_permissions_service,
    get_user_groups_service
)


router = APIRouter(

    prefix="/apiV3/groups",

    tags=["Groups"]
)



# -----------------------------------
# CREATE GROUP
# -----------------------------------

@router.post("/create")
def create_group(

    data:CreateGroupRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        create_group_service(
            db,
            data,
            current_user.id
        )
    )



# -----------------------------------
# GET ALL GROUPS
# -----------------------------------

@router.get("/")
def get_all_groups(

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        get_all_groups_service(
            db
        )
    )



# -----------------------------------
# ASSIGN USER TO GROUP
# -----------------------------------

@router.post("/assign-user")
def assign_user(

    data:AssignUserGroupRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        assign_user_group_service(
            db,
            data,
            current_user.id
        )
    )



# -----------------------------------
# REMOVE USER FROM GROUP
# -----------------------------------

@router.delete("/remove-user")
def remove_user(

    data:RemoveUserGroupRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        remove_user_group_service(
            db,
            data,
            current_user.id
        )
    )



# -----------------------------------
# ASSIGN GROUP PERMISSION
# -----------------------------------

@router.post("/assign-permission")
def assign_permission(

    data:AssignGroupPermissionRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        assign_group_permission_service(
            db,
            data,
            current_user.id
        )
    )



# -----------------------------------
# REMOVE GROUP PERMISSION
# -----------------------------------

@router.delete("/remove-permission")
def remove_permission(

    data:RemoveGroupPermissionRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        remove_group_permission_service(
            db,
            data,
            current_user.id
        )
    )



# -----------------------------------
# GET GROUP PERMISSIONS
# -----------------------------------

@router.get("/{group_id}/permissions")
def get_permissions(

    group_id:int,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        get_group_permissions_service(
            db,
            group_id
        )
    )
    
    
    
# -----------------------------------
# GET USER GROUPS
# -----------------------------------

@router.get("/user/{user_id}")
def get_user_groups(

    user_id:int,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        get_user_groups_service(
            db,
            user_id
        )
    )
    
    
# -----------------------------------
# GET GROUP USERS
# -----------------------------------

@router.get("/{group_id}/users")
def get_group_users(

    group_id:int,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        get_group_users_service(
            db,
            group_id
        )
    )
    
# -----------------------------------
# DELETE GROUP
# -----------------------------------

@router.delete("/{group_id}")
def delete_group(

    group_id:int,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        delete_group_service(
            db,
            group_id,
            current_user.id
        )
    )