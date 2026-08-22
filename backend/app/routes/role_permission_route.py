from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_asset_db
from app.schemas.role_permission_schema import (
    UpdateRolePermissionSchema,
)


from app.schemas.role_schema import (
     AssignPermissionRequest,
     RemovePermissionRequest
)


from app.services.role_permission_service import (
    get_role_permissions_service,
    update_role_permissions_service,
)

from app.services.role_service import (
    assign_role_permission_service,
    get_role_permissions_service,
    remove_role_permission_service  
)



from app.core.admin_require import require_admin
router = APIRouter(
    prefix="/apiV3/roles",
    tags=["Role Permissions"]
)


# -----------------------------------
# GET ROLE PERMISSIONS
# -----------------------------------

@router.get("/{role_id}/permissions")

def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_asset_db)
):

    return (
        get_role_permissions_service(
            db,
            role_id
        )
    )

# -----------------------------------
# UPDATE ROLE PERMISSIONS
# -----------------------------------

@router.put("/{role_id}/permissions")

def update_role_permissions(
    role_id: int,
    data: UpdateRolePermissionSchema,
    db: Session = Depends(get_asset_db),
    current_user=Depends(require_admin)
):

    return (
        update_role_permissions_service(
            db,
            role_id,
            data,
            current_user.id
        )
    )

@router.post("/assign-role-permission")
def assign_permission(

    data:AssignPermissionRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return assign_role_permission_service(
        db,
        data,
        current_user.id
    )


    
    
@router.delete(
    "/remove-permission"
)
def remove_permission(

    data:RemovePermissionRequest,

    db:Session=
    Depends(get_asset_db),

    current_user=
    Depends(require_admin)
):

    return (
        remove_role_permission_service(
            db,
            data,
            current_user.id
        )
    )
    








