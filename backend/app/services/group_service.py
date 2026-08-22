from tokenize import group

from fastapi import HTTPException

from app.models.group_model import Group

from app.models.user_group_model import (
    UserGroup
)

from app.models.group_permission_model import (
    GroupPermission
)

from app.repository.group_repository import (

    delete_group_repo,
    get_group_by_id_repo,
    get_all_groups_repo,

    get_group_by_name_repo,

    create_group_repo,
    get_group_users_repo,

    get_user_group_repo,

    assign_user_group_repo,

    remove_user_group_repo,

    get_group_permission_repo,

    assign_group_permission_repo,

    remove_group_permission_repo,

    get_group_permissions_repo,
    get_user_groups_repo
)
from app.services.activity_log_service import log_activity


# -----------------------------------
# CREATE GROUP
# -----------------------------------

def create_group_service(
    db,
    data,
    performed_by
):

    existing_group = (

        get_group_by_name_repo(
            db,
            data.group_name
        )
    )

    if existing_group:

        raise HTTPException(

            status_code=400,

            detail="Group already exists"
        )

    group = Group(

        group_name=data.group_name,

        description=data.description
    )

    group = create_group_repo(
        db,
        group
    )

    log_activity(
    db=db,
    created_by=performed_by,
    module="GROUP",
    action="CREATE",
    item_type="GROUP",
    item_id=group.id,
    item_name=group.group_name,
    notes=(
    f"Created group '{group.group_name}'. "
    f"Description: '{group.description or 'N/A'}'."
)
)
    
    db.commit()

    db.refresh(group)

    return {

        "id": group.id,

        "group_name": group.group_name,

        "description": group.description
    }



# -----------------------------------
# GET ALL GROUPS
# -----------------------------------

def get_all_groups_service(db):

    groups = get_all_groups_repo(db)

    response = []

    for group in groups:

        response.append({

            "id": group.id,

            "group_name": group.group_name,

            "description": group.description
        })

    return response



# -----------------------------------
# ASSIGN USER TO GROUP
# -----------------------------------

def assign_user_group_service(
    db,
    data,
    performed_by
):

    existing = (

        get_user_group_repo(

            db,

            data.user_id,

            data.group_id
        )
    )

    if existing:

        raise HTTPException(

            status_code=400,

            detail=
            "User already in group"
        )

    user_group = UserGroup(

        user_id=data.user_id,

        group_id=data.group_id
    )
    group = get_group_by_id_repo(
        db,
        data.group_id
    )

    assign_user_group_repo(
        db,
        user_group
    )

    log_activity(
        db=db,
        created_by=performed_by,
        module="GROUP",
        action="ASSIGN_USER",
        item_type="GROUP",
        item_id=group.id,
        item_name=group.group_name,
        target_user_id=data.user_id,
        notes=(
            f"Assigned user ID {data.user_id} "
            f"to group '{group.group_name}'."
        )
    )
    db.commit()

    return {

        "message":
        "User added to group"
    }



# -----------------------------------
# REMOVE USER FROM GROUP
# -----------------------------------

def remove_user_group_service(
    db,
    data,
    performed_by
):

    remove_user_group_repo(

        db,

        data.user_id,

        data.group_id
    )
    group = get_group_by_id_repo(
    db,
    data.group_id
)

    log_activity(
    db=db,
    created_by=performed_by,
    module="GROUP",
    action="REMOVE_USER",
    item_type="GROUP",
    item_id=data.group_id,
    target_user_id=data.user_id,
    notes=(
        f"Removed user ID {data.user_id} "
        f"from group '{group.group_name}'."
    )
)
    db.commit()

    return {

        "message":
        "User removed from group"
    }



# -----------------------------------
# ASSIGN GROUP PERMISSION
# -----------------------------------

def assign_group_permission_service(
    db,
    data,
    performed_by
):

    existing = (

        get_group_permission_repo(

            db,

            data.group_id,

            data.permission_id
        )
    )

    if existing:

        raise HTTPException(

            status_code=400,

            detail=
            "Permission already assigned"
        )

    group_permission = GroupPermission(

        group_id=data.group_id,

        permission_id=data.permission_id
    )

    assign_group_permission_repo(
        db,
        group_permission
    )
    log_activity(
    db=db,
    created_by=performed_by,
    module="GROUP",
    action="ASSIGN_PERMISSION",
    item_type="GROUP",
    item_id=data.group_id,
    notes=(
    f"Assigned permission ID "
    f"{data.permission_id} "
    f"to group '{group.group_name}'."
)
)
    
    db.commit()


    return {

        "message":
        "Permission assigned to group"
    }



# -----------------------------------
# REMOVE GROUP PERMISSION
# -----------------------------------

def remove_group_permission_service(
    db,
    data,
    performed_by
):

    remove_group_permission_repo(

        db,

        data.group_id,

        data.permission_id
    )
    log_activity(
    db=db,
    created_by=performed_by,
    module="GROUP",
    action="REMOVE_PERMISSION",
    item_type="GROUP",
    item_id=data.group_id,
    notes=(
    f"Removed permission ID "
    f"{data.permission_id} "
    f"from group '{group.group_name}'."
)
)
    db.commit()

    return {

        "message":
        "Permission removed from group"
    }



# -----------------------------------
# GET GROUP PERMISSIONS
# -----------------------------------

def get_group_permissions_service(
    db,
    group_id
):

    permissions = (

        get_group_permissions_repo(
            db,
            group_id
        )
    )



    response = []

    for p in permissions:

        response.append({

            "id": p.id,

            "permission_code":
            p.permission_code,

            "module_name":
            p.module_name
        })

    return response


# -----------------------------------
# GET USER GROUPS
# -----------------------------------

def get_user_groups_service(
    db,
    user_id
):

    groups = (

        get_user_groups_repo(
            db,
            user_id
        )
    )

    response = []

    for user_group, group in groups:

        response.append({

            "group_id": group.id,

            "group_name": group.group_name
        })

    return response


# -----------------------------------
# GET GROUP USERS
# -----------------------------------

def get_group_users_service(
    db,
    group_id
):

    users = (

        get_group_users_repo(
            db,
            group_id
        )
    )

    response = []

    for user_group, user in users:

        response.append({

            "user_id": user.id,

            "email": user.email
        })

    return response


# -----------------------------------
# DELETE GROUP
# -----------------------------------

def delete_group_service(
    db,
    group_id,
    performed_by
):

    group = (

        get_group_by_id_repo(
            db,
            group_id
        )
    )

    if not group:

        raise HTTPException(

            status_code=404,

            detail="Group not found"
        )

    delete_group_repo(
        db,
        group
    )
    log_activity(
    db=db,
    created_by=performed_by,
    module="GROUP",
    action="DELETE",
    item_type="GROUP",
    item_id=group.id,
    item_name=group.group_name,
    notes=(
        f"Deleted group "
        f"'{group.group_name}'."
    )
)
    db.commit()
    
    return {
        "message":
        "Group deleted successfully"
    }