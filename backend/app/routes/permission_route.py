from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.core.dependencies import (
    get_current_user
)
from app.schemas.permission_schema import (
    CreatePermissionRequest,
    AssignUserPermissionRequest, 
    RemoveUserPermissionRequest)

from app.services.permission_service import (
    get_user_permissions_service,
    create_permission_service,
    get_all_permissions_service,
    get_all_users_permissions_service,
    assign_user_permission_service,
    remove_user_permission_service,
    get_user_direct_permissions_service
)


from app.core.admin_require import (
    require_admin
)

router=APIRouter(
    prefix="/apiV3/permissions",
    tags=["Permissions"]
)



@router.post("/create")
def create_permission(

    data:CreatePermissionRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return create_permission_service(
        db,
        data,
        current_user.id
    )
    
@router.get("/")
def get_all_permissions(

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return get_all_permissions_service(db)

@router.get("/me")
def get_my_permissions(

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(
        get_current_user
    )
):

    return (
        get_user_permissions_service(
            db,
            current_user.id
        )
    )
    


@router.get("/all_users")
def get_all_users_permissions(

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        get_all_users_permissions_service(
            db
        )
    )
    
    
# ------------------------------------
# ASSIGN DIRECT PERMISSION
# ------------------------------------

@router.post("/assign-user-permission")
def assign_permission(

    data:AssignUserPermissionRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        assign_user_permission_service(
            db,
            data,
            current_user.id
        )
    )



# ------------------------------------
# REMOVE DIRECT PERMISSION
# ------------------------------------

@router.delete("/remove-user-permission")
def remove_permission(

    data:RemoveUserPermissionRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        remove_user_permission_service(
            db,
            data,
            current_user.id
        )
    )



# ------------------------------------
# GET USER DIRECT PERMISSIONS
# ------------------------------------

@router.get("/user/{user_id}/permissions")
def get_user_permissions(

    user_id:int,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        get_user_direct_permissions_service(
            db,
            user_id
        )
    )