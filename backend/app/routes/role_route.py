from fastapi import (
    APIRouter,
    Depends
)
from sqlalchemy.orm import Session
from app.db.database import get_asset_db
from app.schemas.role_schema import (
    AssignRoleRequest,
    AssignPermissionRequest,
    CreateRoleRequest,
    RemovePermissionRequest,
    RemoveUserRoleRequest,
    UpdateUserRoleRequest
)


from app.services.role_service import (
    assign_role_service,
    assign_role_permission_service,
    create_role_service,
    get_all_roles_service,
    get_role_permissions_service,
    remove_role_permission_service,
    remove_user_role_service,
    get_user_role_service,
    update_user_role_service
)

from app.core.admin_require import (
    require_admin
)

router=APIRouter(

    prefix="/apiV3/roles",

    tags=["Roles"]
)




@router.get("/")
def get_all_roles(

    db:Session=
    Depends(get_asset_db),

    # current_user=
    # Depends(require_admin)
):

    return get_all_roles_service(db)




@router.post("/create")
def create_role(

    data:CreateRoleRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return create_role_service(
        db,
        data,
        current_user.id
    )

@router.post("/assign")
def assign_role(

    data:AssignRoleRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return assign_role_service(
        db,
        data,
        current_user.id
    )
    
    

# @router.post("/assign-role-permission")
# def assign_permission(

#     data:AssignPermissionRequest,

#     db:Session=
#     Depends(get_asset_db),

#     current_user=
#     Depends(require_admin)
# ):

#     return assign_role_permission_service(
#         db,
#         data,
#         current_user.id
#     )
    
    
# @router.get(
#     "/{role_id}/permissions"
# )
# def get_role_permissions(

#     role_id:int,

#     db:Session=
#     Depends(get_asset_db),

#     # current_user=
#     # Depends(require_admin)
# ):

#     return (
#         get_role_permissions_service(
#             db,
#             role_id
#         )
#     )
    
    
    
    
# @router.delete(
#     "/remove-permission"
# )
# def remove_permission(

#     data:RemovePermissionRequest,

#     db:Session=
#     Depends(get_asset_db),

#     current_user=
#     Depends(require_admin)
# ):

#     return (
#         remove_role_permission_service(
#             db,
#             data,
#             current_user.id
#         )
#     )
    
    
    



@router.delete("/remove-user-role")
def remove_user_role(

    data:RemoveUserRoleRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        remove_user_role_service(
            db,
            data,
            current_user.id
        )
    )
    
    
    



@router.get("/user/{user_id}")
def get_user_role(

    user_id:int,

    db:Session=
    Depends(get_asset_db),

    # current_user=
    # Depends(require_admin)
):

    return (
        get_user_role_service(
            db,
            user_id
        )
    )
    



@router.put(
    "/update-user-role"
)
def update_user_role(

    data:UpdateUserRoleRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        update_user_role_service(
            db,
            data,
            current_user.id
        )
    )