from app.models.role_permission_model import RolePermission

from app.repository.role_permission_repository import (
    get_role_permissions_repo,
    delete_role_permissions_repo,
    assign_role_permission_repo
)

from app.services.activity_log_service import log_activity


# -----------------------------------
# GET ROLE PERMISSIONS
# -----------------------------------

def get_role_permissions_service(
    db,
    role_id
):

    permissions = (
        get_role_permissions_repo(
            db,
            role_id
        )
    )

    response = []

    for permission in permissions:

        response.append({

            "id":
            permission.id,

            "permission_code":
            permission.permission_code,

            "module_name":
            permission.module_name
        })

    return response


# -----------------------------------
# UPDATE ROLE PERMISSIONS
# -----------------------------------

def update_role_permissions_service(
    db,
    role_id,
    data,
    performed_by
):

    # remove old permissions

    delete_role_permissions_repo(
        db,
        role_id
    )

    # add new permissions

    for permission_id in data.permission_ids:

        role_permission = RolePermission(

            role_id=role_id,

            permission_id=permission_id
        )

        assign_role_permission_repo(
            db,
            role_permission
        )

    log_activity(
    db=db,
    created_by=performed_by,
    module="ROLE",
    action="UPDATE_PERMISSIONS",
    item_type="ROLE",
    item_id=role_id,
    notes=(
        f"Updated role permissions. "
        f"Assigned {len(data.permission_ids)} permission(s)."
    ),
    changes={
        "permission_ids": data.permission_ids
    }
)

    db.commit()

    return {

        "message":
        "Role permissions updated successfully"
    }