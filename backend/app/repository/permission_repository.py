from app.models.permission_model import Permission
from app.models.role_permission_model import RolePermission
from app.models.user_role_model import UserRole
from app.models.auth_model import AuthUser
from app.models.role_model import Role
from app.models.user_permission_model import UserPermission
from app.models.group_permission_model import (
    GroupPermission
)

from app.models.user_group_model import (
    UserGroup
)




def get_all_users_permissions_repo(db):

    users = db.query(AuthUser).all()

    response = []

    for user in users:

        # -----------------------------
        # GET USER ROLE
        # -----------------------------

        user_role = (

            db.query(UserRole)

            .filter(
                UserRole.user_id == user.id
            )

            .first()
        )

        role_name = None

        if user_role:

            role = (

                db.query(Role)

                .filter(
                    Role.id == user_role.role_id
                )

                .first()
            )

            if role:

                role_name = role.role_name


        # -----------------------------
        # GET FINAL USER PERMISSIONS
        # -----------------------------

        permissions = (

            get_user_permissions_repo(
                db,
                user.id
            )
        )


        response.append({

            "user_id": user.id,

            "email": user.email,

            "role": role_name,

            "permissions": permissions
        })

    return response





def get_all_permissions_repo(db):

    return (

        db.query(Permission)

        .order_by(

            Permission.module_name,

            Permission.permission_code
        )

        .all()
    )





def get_permission_by_code_repo(
    db,
    permission_code
):

    return (

        db.query(Permission)

        .filter(
            Permission.permission_code
            == permission_code
        )

        .first()
    )


def create_permission_repo(
    db,
    permission
):

    db.add(permission)

    db.flush()

    return permission


def get_user_permissions_repo(
    db,
    user_id
):

    # -----------------------------------
    # ROLE BASED PERMISSIONS
    # -----------------------------------

    role_permissions = (

        db.query(
            Permission.permission_code
        )

        .join(

            RolePermission,

            Permission.id
            == RolePermission.permission_id
        )

        .join(

            UserRole,

            UserRole.role_id
            == RolePermission.role_id
        )

        .filter(
            UserRole.user_id
            == user_id
        )

        .all()
    )



    # -----------------------------------
    # GROUP BASED PERMISSIONS
    # -----------------------------------

    group_permissions = (

        db.query(
            Permission.permission_code
        )

        .join(

            GroupPermission,

            Permission.id
            == GroupPermission.permission_id
        )

        .join(

            UserGroup,

            UserGroup.group_id
            == GroupPermission.group_id
        )

        .filter(
            UserGroup.user_id
            == user_id
        )

        .all()
    )



    # -----------------------------------
    # DIRECT USER PERMISSIONS
    # -----------------------------------

    user_permissions = (

        db.query(
            Permission.permission_code
        )

        .join(

            UserPermission,

            Permission.id
            == UserPermission.permission_id
        )

        .filter(
            UserPermission.user_id
            == user_id
        )

        .all()
    )



    # -----------------------------------
    # MERGE ALL
    # -----------------------------------

    permissions = set()

    for p in role_permissions:

        permissions.add(p[0])

    for p in group_permissions:

        permissions.add(p[0])

    for p in user_permissions:

        permissions.add(p[0])



    return sorted(list(permissions))


# # ------------------------------------
# # CHECK USER PERMISSION EXISTS
# # ------------------------------------

def get_user_permission_repo(
    db,
    user_id,
    permission_id
):

    return (

        db.query(UserPermission)

        .filter(

            UserPermission.user_id
            == user_id,

            UserPermission.permission_id
            == permission_id
        )

        .first()
    )



# ------------------------------------
# ASSIGN USER PERMISSION
# ------------------------------------

def assign_user_permission_repo(
    db,
    user_permission
):

    db.add(user_permission)

    db.flush()

    return user_permission



# ------------------------------------
# REMOVE USER PERMISSION
# ------------------------------------

def remove_user_permission_repo(
    db,
    user_id,
    permission_id
):

    permission = (

        db.query(UserPermission)

        .filter(

            UserPermission.user_id
            == user_id,

            UserPermission.permission_id
            == permission_id
        )

        .first()
    )

    if permission:

        db.delete(permission)


    return True



# ------------------------------------
# GET USER DIRECT PERMISSIONS
# ------------------------------------

def get_user_direct_permissions_repo(
    db,
    user_id
):

    permissions = (

        db.query(

            Permission.id,

            Permission.permission_code
        )

        .join(

            UserPermission,

            Permission.id
            == UserPermission.permission_id
        )

        .filter(
            UserPermission.user_id
            == user_id
        )

        .all()
    )

    return permissions





def has_global_permission_repo(
    db,
    user_id: int,
    permission_code: str
):
    # ------------------------------------------------
    # 1. Direct User Permission
    # ------------------------------------------------
    has_user_permission = (
        db.query(UserPermission)
        .join(
            Permission,
            Permission.id == UserPermission.permission_id
        )
        .filter(
            UserPermission.user_id == user_id,
            Permission.permission_code == permission_code
        )
        .first()
    )

    if has_user_permission:
        return True

    # ------------------------------------------------
    # 2. Role Permission
    # ------------------------------------------------
    has_role_permission = (
        db.query(RolePermission)
        .join(
            Permission,
            Permission.id == RolePermission.permission_id
        )
        .join(
            UserRole,
            UserRole.role_id == RolePermission.role_id
        )
        .filter(
            UserRole.user_id == user_id,
            Permission.permission_code == permission_code
        )
        .first()
    )

    return has_role_permission is not None