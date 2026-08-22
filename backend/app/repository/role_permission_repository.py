from app.models.role_permission_model import RolePermission
from app.models.permission_model import Permission


# -----------------------------------
# GET ROLE PERMISSIONS
# -----------------------------------

def get_role_permissions_repo(
    db,
    role_id
):

    return (

        db.query(Permission)

        .join(
            RolePermission,
            Permission.id == RolePermission.permission_id
        )

        .filter(
            RolePermission.role_id == role_id
        )

        .all()
    )


# -----------------------------------
# DELETE ROLE PERMISSIONS
# -----------------------------------

def delete_role_permissions_repo(
    db,
    role_id
):

    (
        db.query(RolePermission)

        .filter(
            RolePermission.role_id == role_id
        )

        .delete(
            synchronize_session=False
        )
    )


# -----------------------------------
# ASSIGN ROLE PERMISSION
# -----------------------------------

def assign_role_permission_repo(
    db,
    role_permission
):

    db.add(role_permission)

    return role_permission