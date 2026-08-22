from app.models.user_role_model import UserRole
from app.models.role_permission_model import (
    RolePermission
)
from app.models.permission_model import Permission

from app.models.role_model import Role



def get_all_roles_repo(db):

    return (

        db.query(Role)

        .order_by(Role.role_name)

        .all()
    )

def get_user_role_repo(
    db,
    user_id
):

    return (

        db.query(UserRole)

        .filter(
            UserRole.user_id == user_id
        )

        .first()
    )


def assign_role_repo(
    db,
    user_role
):

    db.add(user_role)

    db.flush()

    

    return user_role







def get_role_by_name_repo(
    db,
    role_name
):

    return (

        db.query(Role)

        .filter(
            Role.role_name == role_name
        )

        .first()
    )


def create_role_repo(
    db,
    role
):

    db.add(role)

    db.flush()

    db.refresh(role)

    return role

def get_role_permission_repo(
    db,
    role_id,
    permission_id
):

    return (

        db.query(RolePermission)

        .filter(

            RolePermission.role_id == role_id,

            RolePermission.permission_id
            == permission_id

        )

        .first()
    )


def assign_permission_repo(
    db,
    role_permission
):

    db.add(role_permission)

    db.flush()

    db.refresh(role_permission)

    return role_permission



def get_role_permissions_repo(
    db,
    role_id
):

    permissions = (

        db.query(

            Permission.id,

            Permission.permission_code,
            Permission.module_name
        )

        .join(

            RolePermission,

            Permission.id ==

            RolePermission.permission_id
        )

        .filter(
            RolePermission.role_id
            == role_id
        )

        .all()
    )

    return permissions

def remove_role_permission_repo(
    db,
    role_id,
    permission_id
):

    role_permission = (

        db.query(RolePermission)

        .filter(

            RolePermission.role_id
            == role_id,

            RolePermission.permission_id
            == permission_id
        )

        .first()
    )

    if role_permission:

        db.delete(role_permission)

       

    return True


def remove_user_role_repo(
    db,
    user_id
):

    user_role = (

        db.query(UserRole)

        .filter(
            UserRole.user_id
            == user_id
        )

        .first()
    )

    if user_role:

        db.delete(user_role)

      

    return True


def get_user_role_details_repo(
    db,
    user_id
):

    result = (

        db.query(
            UserRole,
            Role
        )

        .join(
            Role,

            UserRole.role_id
            == Role.id
        )

        .filter(
            UserRole.user_id
            == user_id
        )

        .first()
    )

    return result

def update_user_role_repo(
    db,
    user_id,
    role_id
):

    user_role = (

        db.query(UserRole)

        .filter(
            UserRole.user_id
            == user_id
        )

        .first()
    )

    # -----------------------------
    # UPDATE EXISTING
    # -----------------------------

    if user_role:

        user_role.role_id = role_id

    # -----------------------------
    # CREATE NEW
    # -----------------------------

    else:

        user_role = UserRole(

            user_id=user_id,

            role_id=role_id
        )

        db.add(user_role)

        db.flush()


    return user_role


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