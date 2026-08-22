from app.models.group_model import Group
from app.models.auth_model import AuthUser
from app.models.user_group_model import (
    UserGroup
)

from app.models.group_permission_model import (
    GroupPermission
)

from app.models.permission_model import (
    Permission
)





# -----------------------------------
# GET ALL GROUPS
# -----------------------------------

def get_all_groups_repo(db):

    return (

        db.query(Group)

        .order_by(Group.group_name)

        .all()
    )



# -----------------------------------
# GET GROUP BY NAME
# -----------------------------------

def get_group_by_name_repo(
    db,
    group_name
):

    return (

        db.query(Group)

        .filter(
            Group.group_name
            == group_name
        )

        .first()
    )



# -----------------------------------
# CREATE GROUP
# -----------------------------------

def create_group_repo(
    db,
    group
):

    db.add(group)

    db.flush()

    return group



# -----------------------------------
# CHECK USER GROUP EXISTS
# -----------------------------------

def get_user_group_repo(
    db,
    user_id,
    group_id
):

    return (

        db.query(UserGroup)

        .filter(

            UserGroup.user_id
            == user_id,

            UserGroup.group_id
            == group_id
        )

        .first()
    )



# -----------------------------------
# ASSIGN USER GROUP
# -----------------------------------

def assign_user_group_repo(
    db,
    user_group
):

    db.add(user_group)

    db.flush()

    return user_group



# -----------------------------------
# REMOVE USER GROUP
# -----------------------------------

def remove_user_group_repo(
    db,
    user_id,
    group_id
):

    user_group = (

        db.query(UserGroup)

        .filter(

            UserGroup.user_id
            == user_id,

            UserGroup.group_id
            == group_id
        )

        .first()
    )

    if user_group:

        db.delete(user_group)

       

    return True



# -----------------------------------
# CHECK GROUP PERMISSION EXISTS
# -----------------------------------

def get_group_permission_repo(
    db,
    group_id,
    permission_id
):

    return (

        db.query(GroupPermission)

        .filter(

            GroupPermission.group_id
            == group_id,

            GroupPermission.permission_id
            == permission_id
        )

        .first()
    )



# -----------------------------------
# ASSIGN GROUP PERMISSION
# -----------------------------------

def assign_group_permission_repo(
    db,
    group_permission
):

    db.add(group_permission)

    db.flush()

    

    return group_permission



# -----------------------------------
# REMOVE GROUP PERMISSION
# -----------------------------------

def remove_group_permission_repo(
    db,
    group_id,
    permission_id
):

    permission = (

        db.query(GroupPermission)

        .filter(

            GroupPermission.group_id
            == group_id,

            GroupPermission.permission_id
            == permission_id
        )

        .first()
    )

    if permission:

        db.delete(permission)

       

    return True



# -----------------------------------
# GET GROUP PERMISSIONS
# -----------------------------------

def get_group_permissions_repo(
    db,
    group_id
):

    permissions = (

        db.query(

            Permission.id,

            Permission.permission_code,

            Permission.module_name
        )

        .join(

            GroupPermission,

            Permission.id
            == GroupPermission.permission_id
        )

        .filter(
            GroupPermission.group_id
            == group_id
        )

        .all()
    )

    return permissions


# -----------------------------------
# GET USER GROUPS
# -----------------------------------

def get_user_groups_repo(
    db,
    user_id
):

    groups = (

        db.query(

            UserGroup,

            Group
        )

        .join(

            Group,

            UserGroup.group_id
            == Group.id
        )

        .filter(
            UserGroup.user_id
            == user_id
        )

        .all()
    )

    return groups


# -----------------------------------
# GET GROUP USERS
# -----------------------------------

def get_group_users_repo(
    db,
    group_id
):

    users = (

        db.query(

            UserGroup,

            AuthUser
        )

        .join(

            AuthUser,

            UserGroup.user_id
            == AuthUser.id
        )

        .filter(
            UserGroup.group_id
            == group_id
        )

        .all()
    )

    return users


# -----------------------------------
# GET GROUP BY ID
# -----------------------------------

def get_group_by_id_repo(
    db,
    group_id
):

    return (

        db.query(Group)

        .filter(
            Group.id
            == group_id
        )

        .first()
    )



# -----------------------------------
# DELETE GROUP
# -----------------------------------

def delete_group_repo(
    db,
    group
):

    db.delete(group)

   

    return True