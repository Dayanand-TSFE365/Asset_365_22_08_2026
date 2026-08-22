from fastapi import HTTPException

from app.models.user_role_model import UserRole
from app.core.default_role_permissions import (
    DEFAULT_ROLE_PERMISSIONS
)
from app.models.employee_model import Employee
from app.services.activity_log_service import log_activity
from app.repository.role_repository import (
    get_user_role_repo,
    assign_role_repo,
    get_role_permission_repo,
    assign_permission_repo,
    get_role_by_name_repo,
    create_role_repo,
    get_all_roles_repo,
    get_role_permissions_repo,
    remove_role_permission_repo,
    remove_user_role_repo,
    get_user_role_details_repo,
    update_user_role_repo,
    get_permission_by_code_repo
)

from app.models.role_permission_model import (
    RolePermission
)
from app.models.role_model import Role


def get_all_roles_service(db):
    
    roles = get_all_roles_repo(db)
    response = []

    for role in roles:

        response.append({

            "id": role.id,

            "role_name":
            role.role_name,

            "description":
            role.description
        })

    return response


def assign_role_service(
    db,
    data,
    performed_by
):

    # -----------------------------
    # CHECK EXISTING ROLE
    # -----------------------------

    existing_role = (
        get_user_role_repo(
            db,
            data.user_id
        )
    )

    if existing_role:

        raise HTTPException(
            status_code=400,
            detail="User already has role assigned"
        )

    # -----------------------------
    # ASSIGN ROLE
    # -----------------------------

    user_role = UserRole(

        user_id=data.user_id,

        role_id=data.role_id
    )

    assign_role_repo(
        db,
        user_role
    )

    log_activity(
    db=db,
    created_by=performed_by,
    module="ROLE",
    action="ASSIGN",
    item_type="ROLE",
    item_id=data.role_id,
    item_name="User Role Assignment",
    target_user_id=data.user_id,
    notes="Role assigned to user"
)
    role = (

    db.query(Role)

    .filter(
        Role.id == data.role_id
    )

    .first()
    )

    employee = (

        db.query(Employee)

        .filter(
            Employee.auth_user_id
            == data.user_id
        )

        .first()
    )

    if employee and role:

        employee.department = (
        role.role_name
        )

    
    db.commit()

    return {

        "message":
        "Role assigned successfully"
    }
    
    
    



def assign_role_permission_service(
    db,
    data,
    performed_by
):

    # --------------------------------
    # CHECK EXISTING
    # --------------------------------

    existing = (

        get_role_permission_repo(

            db,

            data.role_id,

            data.permission_id
        )
    )

    if existing:

        raise HTTPException(

            status_code=400,

            detail=
            "Permission already assigned to role"
        )

    # --------------------------------
    # ASSIGN PERMISSION
    # --------------------------------

    role_permission = RolePermission(

        role_id=data.role_id,

        permission_id=data.permission_id
    )

    assign_permission_repo(

        db,
        role_permission

    )

    log_activity(
    db=db,
    created_by=performed_by,
    module="PERMISSION",
    action="ASSIGN",
    item_type="ROLE_PERMISSION",
    item_id=data.role_id,
    notes="Permission assigned to role"
)

    db.commit()
    return {

        "message":

        "Permission assigned successfully"
    }
    
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

    for p in permissions:

        response.append({

            "id": p.id,

            "permission_code":
            p.permission_code,
            
            "module_name":
            p.module_name
            
        })

    return response


def remove_role_permission_service(
    db,
    data,
    performed_by
):

    remove_role_permission_repo(

        db,

        data.role_id,

        data.permission_id
    )
    log_activity(
    db=db,
    created_by=performed_by,
    module="PERMISSION",
    action="REMOVE",
    item_type="ROLE_PERMISSION",
    item_id=data.role_id,
    notes="Permission removed from role"
)
    db.commit()

    return {

        "message":
        "Permission removed successfully"
    }





def remove_user_role_service(
    db,
    data,
    performed_by
):

    remove_user_role_repo(
        db,
        data.user_id
    )

    log_activity(
    db=db,
    created_by=performed_by,
    module="ROLE",
    action="REMOVE",
    item_type="ROLE",
    target_user_id=data.user_id,
    notes="Role removed from user"
)
    
    employee = (

    db.query(Employee)

    .filter(
        Employee.auth_user_id
        == data.user_id
    )

    .first()
    )

    if employee:

        employee.department = None
    
    db.commit()

    return {

        "message":
        "Role removed successfully"
    }



def get_user_role_service(
    db,
    user_id
):

    result = (
        get_user_role_details_repo(
            db,
            user_id
        )
    )

    if not result:

        raise HTTPException(

            status_code=404,

            detail=
            "No role assigned to user"
        )

    user_role, role = result

    return {

        "user_id":
        user_role.user_id,

        "role_id":
        role.id,

        "role_name":
        role.role_name
    }
    



def update_user_role_service(
    db,
    data,
    performed_by
):
    
    role = (

    db.query(Role)

    .filter(
        Role.id == data.role_id
    )

    .first()
    )

    if not role:

        raise HTTPException(
        status_code=404,
        detail="Role not found"
        )

    user_role = (

        update_user_role_repo(

            db,

            data.user_id,

            data.role_id
        )
    )

    log_activity(
    db=db,
    created_by=performed_by,
    module="ROLE",
    action="UPDATE",
    item_type="ROLE",
    item_id=data.role_id,
    target_user_id=data.user_id,
    notes="User role updated"
)    
    
    role = (

    db.query(Role)

    .filter(
        Role.id == data.role_id
    )

    .first()
    )

    employee = (

    db.query(Employee)

    .filter(
        Employee.auth_user_id
        == data.user_id
    )

    .first()
    )

    if employee and role:

        employee.department = (
        role.role_name
        )
    db.commit()
    return {

        "message":
        "User role updated successfully",

        "user_id":
        user_role.user_id,

        "role_id":
        user_role.role_id
    }
    
    


# ------------------------------------------------
# CREATE ROLE SERVICE
# ------------------------------------------------

# def create_role_service(
#     db,
#     data,
#     performed_by
# ):
#     # ---------------------------------
#     # CHECK ROLE EXISTS
#     # ---------------------------------

#     existing_role = (
#         get_role_by_name_repo(
#             db,
#             data.role_name
#         )
#     )

#     if existing_role:

#         raise HTTPException(
#             status_code=400,
#             detail="Role already exists"
#         )



#     # ---------------------------------
#     # CREATE ROLE
#     # ---------------------------------

#     role = Role(

#         role_name=data.role_name,

#         description=data.description
#     )

#     role = create_role_repo(
#         db,
#         role
#     )
#     log_activity(
#     db=db,
#     created_by=performed_by,
#     module="ROLE",
#     action="CREATE",
#     item_type="ROLE",
#     item_id=role.id,
#     item_name=role.role_name,
#     notes="Role created"
# )
    
#     # ---------------------------------
#     # GET DEFAULT PERMISSIONS
#     # ---------------------------------



#     default_permissions = (
#         DEFAULT_ROLE_PERMISSIONS.get(
#             role.role_name,
#             []
#         )
#     )


#     # ---------------------------------
#     # ASSIGN DEFAULT PERMISSIONS
#     # ---------------------------------

#     for permission_code in default_permissions:

#         permission = (
#             get_permission_by_code_repo(
#                 db,
#                 permission_code
#             )
#         )

#         if permission:

#             existing_permission = (
#                 get_role_permission_repo(
#                     db,
#                     role.id,
#                     permission.id
#                 )
#             )

#             if not existing_permission:

#                 role_permission = RolePermission(

#                     role_id=role.id,

#                     permission_id=permission.id
#                 )

#                 db.add(role_permission)


#     db.commit()


#     return {

#         "id": role.id,

#         "role_name": role.role_name,

#         "description": role.description,

#         "default_permissions": default_permissions
#     }


def create_role_service(
    db,
    data,
    performed_by
):

    existing_role = (
        get_role_by_name_repo(
            db,
            data.role_name
        )
    )

    if existing_role:

        raise HTTPException(
            status_code=400,
            detail="Role already exists"
        )

    role = Role(

        role_name=data.role_name,

        description=data.description
    )

    role = create_role_repo(
        db,
        role
    )

    log_activity(
        db=db,
        created_by=performed_by,
        module="ROLE",
        action="CREATE",
        item_type="ROLE",
        item_id=role.id,
        item_name=role.role_name,
        notes="Role created"
    )

    db.commit()

    return {

        "id": role.id,

        "role_name": role.role_name,

        "description": role.description
    }