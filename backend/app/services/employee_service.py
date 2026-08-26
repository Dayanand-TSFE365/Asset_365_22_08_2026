from fastapi import HTTPException

from app.models.employee_model import Employee
from app.models.auth_model import AuthUser
from datetime import datetime

from sqlalchemy.orm import Session

from app.repository.employee_repo import (
    create_employee_repo,
    update_employee_repo,
    get_employee_by_auth_user_id_repo

)
from app.services.activity_log_service import log_activity
from app.core.security import hash_password
from app.repository.employee_repo import get_all_people_repo,get_deleted_employees_repo
from app.models.role_model import Role
from app.models.user_role_model import UserRole

def get_all_employees_service(db):

    users = get_all_people_repo(db)

    response = []

    for auth_user, employee in users:

        response.append({

            # AUTH USER

            "user_id": auth_user.id,

            "email": auth_user.email,

            "role": auth_user.role,

            "is_active": auth_user.is_active,

            "is_verified": auth_user.is_verified,

            "is_approved": auth_user.is_approved,

            # EMPLOYEE

            "employee_id":
            employee.id if employee else None,

            "employee_code":
            employee.employee_code if employee else None,

            "full_name":
            employee.full_name if employee else None,

            "phone":
            employee.phone if employee else None,

            "department":
            employee.department if employee else None,

            "designation":
            employee.designation if employee else None,

            "status":
            employee.status if employee else None,

            # LOGIN

            "login_enabled":

            (
                auth_user.is_active
                and
                auth_user.is_verified
                and
                auth_user.is_approved
            ),

            "created_at":
            auth_user.created_at
        })

    return response




def create_employee_service(
    db: Session,
    data,
    performed_by
):

    # ==========================================================
    # 1. CHECK EMPLOYEE CODE
    # ==========================================================

    existing_employee_code = (
        db.query(Employee)
        .filter(
            Employee.employee_code == data.employee_code
        )
        .first()
    )

    if existing_employee_code:
        raise HTTPException(
            status_code=400,
            detail="Employee code already exists"
        )

    # ==========================================================
    # 2. FIND AUTH USER BY EMAIL
    # ==========================================================

    auth_user = (
        db.query(AuthUser)
        .filter(
            AuthUser.email == data.email
        )
        .first()
    )

    # ==========================================================
    # CASE A
    # ==========================================================
    # User already exists because they registered through
    # /signup.
    #
    # DO NOT CREATE ANOTHER AuthUser.
    # Link Employee to the existing AuthUser.
    # ==========================================================

    if auth_user:

        # ------------------------------------------
        # Check whether this AuthUser already has
        # an Employee record
        # ------------------------------------------

        existing_employee = (
            db.query(Employee)
            .filter(
                Employee.auth_user_id == auth_user.id
            )
            .first()
        )

        if existing_employee:

            raise HTTPException(
                status_code=400,
                detail=(
                    "An employee is already linked "
                    "to this email address."
                )
            )

        # ------------------------------------------
        # Employee created from existing signup user
        # ------------------------------------------

        full_name = (
            f"{data.first_name} "
            f"{data.last_name}"
        ).strip()

        employee = Employee(

            auth_user_id=auth_user.id,

            employee_code=data.employee_code,

            full_name=full_name,

            # IMPORTANT:
            # Always take email from AuthUser
            # for consistency.
            email=auth_user.email,

            phone=data.phone,

            department=data.department,

            designation=data.designation,

            status="Active",

            is_deleted=False
        )

        employee = create_employee_repo(
            db,
            employee
        )

    # ==========================================================
    # CASE B
    # ==========================================================
    # Email does NOT exist.
    #
    # This means admin is creating an employee directly.
    #
    # Create AuthUser + Employee together.
    # ==========================================================

    else:

        # ------------------------------------------
        # Password validation
        # ------------------------------------------

        if data.login_enabled:

            if not data.password:
                raise HTTPException(
                    status_code=400,
                    detail="Password is required"
                )

            if data.password != data.confirm_password:
                raise HTTPException(
                    status_code=400,
                    detail="Passwords do not match"
                )

        # ------------------------------------------
        # Create AuthUser
        # ------------------------------------------

        auth_user = AuthUser(

            email=data.email,

            password_hash=(
                hash_password(data.password)
                if data.password
                else None
            ),

            role="employee",

            is_active=data.login_enabled,

            failed_attempts=0,

            is_verified=data.login_enabled,

            is_approved=data.login_enabled,

            created_at=datetime.utcnow(),

            updated_at=datetime.utcnow()
        )

        db.add(auth_user)

        # Get generated AuthUser.id
        db.flush()

        # ------------------------------------------
        # Full name
        # ------------------------------------------

        full_name = (
            f"{data.first_name} "
            f"{data.last_name}"
        ).strip()

        # ------------------------------------------
        # Create Employee
        # ------------------------------------------

        employee = Employee(

            auth_user_id=auth_user.id,

            employee_code=data.employee_code,

            full_name=full_name,

            email=auth_user.email,

            phone=data.phone,

            department=data.department,

            designation=data.designation,

            status="Active",

            is_deleted=False
        )

        employee = create_employee_repo(
            db,
            employee
        )

    # ==========================================================
    # ACTIVITY LOG
    # ==========================================================

    log_activity(

        db=db,

        created_by=performed_by,

        module="EMPLOYEE",

        action="CREATE",

        item_type="EMPLOYEE",

        item_id=employee.id,

        item_name=employee.full_name,

        notes=(
            f"Created employee '{employee.full_name}' "
            f"(Code: {employee.employee_code}) "
            f"in {employee.department} "
            f"as {employee.designation}."
        )
    )

    # ==========================================================
    # COMMIT
    # ==========================================================

    db.commit()

    db.refresh(auth_user)
    db.refresh(employee)

    # ==========================================================
    # RESPONSE
    # ==========================================================

    return {

        # ------------------------------------------
        # AUTH USER
        # ------------------------------------------

        "user_id": auth_user.id,

        "email": auth_user.email,

        "role": auth_user.role,

        "is_active": auth_user.is_active,

        "is_verified": auth_user.is_verified,

        "is_approved": auth_user.is_approved,

        # ------------------------------------------
        # EMPLOYEE
        # ------------------------------------------

        "employee_id": employee.id,

        "employee_code": employee.employee_code,

        "full_name": employee.full_name,

        "phone": employee.phone,

        "department": employee.department,

        "designation": employee.designation,

        "status": employee.status,

        # ------------------------------------------
        # EXTRA
        # ------------------------------------------

        "login_enabled": auth_user.is_active,

        "created_at": auth_user.created_at
    }
    
# def create_employee_service(
#     db,
#     data,
#     performed_by
# ):

#     # -----------------------------------
#     # CHECK AUTH USER EMAIL
#     # -----------------------------------

#     existing_user = (

#         db.query(AuthUser)

#         .filter(
#             AuthUser.email == data.email
#         )

#         .first()
#     )

#     if existing_user:

#         raise HTTPException(

#             status_code=400,

#             detail="Email already exists"
#         )

#     # -----------------------------------
#     # CHECK EMPLOYEE CODE
#     # -----------------------------------

#     existing_employee_code = (

#         db.query(Employee)

#         .filter(
#             Employee.employee_code
#             == data.employee_code
#         )

#         .first()
#     )

#     if existing_employee_code:

#         raise HTTPException(

#             status_code=400,

#             detail=
#             "Employee code already exists"
#         )

#     # -----------------------------------
#     # PASSWORD VALIDATION
#     # -----------------------------------

#     if data.login_enabled:

#         if not data.password:

#             raise HTTPException(

#                 status_code=400,

#                 detail=
#                 "Password is required"
#             )

#         if data.password != data.confirm_password:

#             raise HTTPException(

#                 status_code=400,

#                 detail=
#                 "Passwords do not match"
#             )

#     # -----------------------------------
#     # CREATE AUTH USER
#     # -----------------------------------

#     auth_user = AuthUser(

#         email=data.email,

#         password_hash=
#         hash_password(
#             data.password
#         ) if data.password else None,

#         role="employee",

#         is_active=data.login_enabled,

#         failed_attempts=0,

#         is_verified=data.login_enabled,

#         is_approved=data.login_enabled,

#         created_at=datetime.utcnow(),

#         updated_at=datetime.utcnow()
#     )

#     db.add(auth_user)

#     db.flush()

#     # -----------------------------------
#     # FULL NAME
#     # -----------------------------------

#     full_name = (

#         f"{data.first_name} "
#         f"{data.last_name}"

#     ).strip()

#     # -----------------------------------
#     # CREATE EMPLOYEE
#     # -----------------------------------

#     employee = Employee(

#         auth_user_id=
#         auth_user.id,

#         employee_code=
#         data.employee_code,

#         full_name=
#         full_name,

#         email=
#         data.email,

#         phone=
#         data.phone,

#         department=
#         data.department,

#         designation=
#         data.designation,

#         status="Active"
#     )

#     employee = create_employee_repo(
#         db,
#         employee
#     )

#     # -----------------------------------
#     # ACTIVITY LOG
#     # -----------------------------------

#     log_activity(

#         db=db,

#         created_by=performed_by,

#         module="EMPLOYEE",

#         action="CREATE",

#         item_type="EMPLOYEE",

#         item_id=employee.id,

#         item_name=employee.full_name,

#         notes=(
#             f"Created employee '{employee.full_name}' "
#             f"(Code: {employee.employee_code}) "
#             f"in {employee.department} as {employee.designation}."
#         )
#     )

#     db.commit()

#     db.refresh(employee)

#     return {

#     # AUTH USER

#     "user_id": auth_user.id,

#     "email": auth_user.email,

#     "role": auth_user.role,

#     "is_active": auth_user.is_active,

#     "is_verified": auth_user.is_verified,

#     "is_approved": auth_user.is_approved,

#     # EMPLOYEE

#     "employee_id": employee.id,

#     "employee_code": employee.employee_code,

#     "full_name": employee.full_name,

#     "phone": employee.phone,

#     "department": employee.department,

#     "designation": employee.designation,

#     "status": employee.status,

#     # EXTRA

#     "login_enabled": auth_user.is_active,

#     "created_at": auth_user.created_at
# }





    
def get_deleted_employees_service(db):

    employees = get_deleted_employees_repo(db)

    response = []

    for emp in employees:

        response.append({

            # -----------------------------
            # AUTH USER
            # -----------------------------

            "user_id": (
                emp.auth_user.id
                if emp.auth_user
                else None
            ),

            "email": (
                emp.auth_user.email
                if emp.auth_user
                else emp.email
            ),

            "role": (
                emp.auth_user.role
                if emp.auth_user
                else None
            ),

            "is_active": (
                emp.auth_user.is_active
                if emp.auth_user
                else False
            ),

            "is_verified": (
                emp.auth_user.is_verified
                if emp.auth_user
                else False
            ),

            "is_approved": (
                emp.auth_user.is_approved
                if emp.auth_user
                else False
            ),

            # -----------------------------
            # EMPLOYEE
            # -----------------------------

            "employee_id": emp.id,

            "employee_code": emp.employee_code,

            "full_name": emp.full_name,

            "phone": emp.phone,

            "department": emp.department,

            "designation": emp.designation,

            "status": emp.status,

            # -----------------------------
            # EXTRA
            # -----------------------------

            "login_enabled": (
                emp.auth_user.is_active
                if emp.auth_user
                else False
            ),

            "created_at": emp.created_at
    })
    return response


def update_employee_service(
    db,
    user_id,
    data,
    performed_by
):

    # ------------------------------------
    # GET AUTH USER
    # ------------------------------------

    auth_user = (

        db.query(AuthUser)

        .filter(
            AuthUser.id == user_id
        )

        .first()
    )

    if not auth_user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ------------------------------------
    # GET EMPLOYEE PROFILE
    # ------------------------------------

    employee = (
        get_employee_by_auth_user_id_repo(
            db,
            user_id
        )
    )
    
    # ------------------------------------
    # CREATE PROFILE IF MISSING
    # ------------------------------------
    profile_created = False

    if not employee:

        employee = Employee(

            auth_user_id=user_id,

            employee_code=(
                data.employee_code
                or f"EMP-{user_id}"
            ),

            full_name="",
            email=auth_user.email,
            phone=None,
            department=None,
            designation=None,
            status="Active"
        )

        create_employee_repo(
            db,
            employee
        )
        profile_created = True
    
    # ------------------------------------
    # CAPTURE OLD VALUES
    # ------------------------------------

    old_values = {
        "full_name": employee.full_name,
        "employee_code": employee.employee_code,
        "department": employee.department,
        "designation": employee.designation,
        "phone": employee.phone,
        "email": employee.email,
        "status": employee.status,
        "login_enabled": auth_user.is_active
    }
    
    # ------------------------------------
    # UPDATE FULL NAME
    # ------------------------------------

    first_name = data.first_name or ""

    last_name = data.last_name or ""

    if first_name or last_name:

        current_name = (
            employee.full_name or ""
        ).split(" ")

        existing_first = (
            current_name[0]
            if len(current_name) > 0
            else ""
        )

        existing_last = (
            " ".join(current_name[1:])
            if len(current_name) > 1
            else ""
        )

        employee.full_name = (

            f"{first_name or existing_first} "

            f"{last_name or existing_last}"

        ).strip()

    # ------------------------------------
    # UPDATE EMPLOYEE FIELDS
    # ------------------------------------

    if data.employee_code:
        employee.employee_code = data.employee_code

    if data.department:
        employee.department = data.department

        role = (

            db.query(Role)

            .filter(
                Role.role_name == data.department
            )

            .first()
        )

        if role:

            user_role = (

            db.query(UserRole)

            .filter(
            UserRole.user_id == user_id
            )

            .first()
            )

            if user_role:

                user_role.role_id = role.id

            else:

                user_role = UserRole(

                user_id=user_id,

                role_id=role.id
                )

                db.add(user_role)

    if data.designation:
        employee.designation = data.designation

    if data.phone:
        employee.phone = data.phone

    if data.status:
        employee.status = data.status

    # ------------------------------------
    # UPDATE EMAIL
    # ------------------------------------

    if data.email:

        existing_email = (

            db.query(AuthUser)

            .filter(
                AuthUser.email == data.email,
                AuthUser.id != user_id
            )

            .first()
        )

        if existing_email:

            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        auth_user.email = data.email

        employee.email = data.email

    # ------------------------------------
    # LOGIN ENABLE / DISABLE
    # ------------------------------------

    if data.login_enabled is not None:

        if data.login_enabled:

            auth_user.is_active = True

            auth_user.is_verified = True

            auth_user.is_approved = True

        else:

            auth_user.is_active = False
            auth_user.is_approved = False

    # ------------------------------------
    # PASSWORD UPDATE
    # ------------------------------------

    if data.password:

        if data.password != data.confirm_password:

            raise HTTPException(
                status_code=400,
                detail="Passwords do not match"
            )

        auth_user.password_hash = (
            hash_password(data.password)
        )

    changed_fields = []

    if old_values["full_name"] != employee.full_name:
        changed_fields.append(
            f"Full Name changed from '{old_values['full_name']}' "
            f"to '{employee.full_name}'"
        )

    if old_values["employee_code"] != employee.employee_code:
        changed_fields.append(
            f"Employee Code: '{old_values['employee_code']}' → '{employee.employee_code}'"
        )

    if old_values["department"] != employee.department:
        changed_fields.append(
            f"Department: '{old_values['department']}' → '{employee.department}'"
        )

    if old_values["designation"] != employee.designation:
        changed_fields.append(
            f"Designation: '{old_values['designation']}' → '{employee.designation}'"
        )

    if old_values["phone"] != employee.phone:
        changed_fields.append(
            "Phone number updated"
        )

    if old_values["email"] != employee.email:
        changed_fields.append(
            f"Email: '{old_values['email']}' → '{employee.email}'"
        )

    if old_values["status"] != employee.status:
        changed_fields.append(
            f"Status: '{old_values['status']}' → '{employee.status}'"
        )

    if old_values["login_enabled"] != auth_user.is_active:
        changed_fields.append(
            f"Login {'Enabled' if auth_user.is_active else 'Disabled'}"
        )

    if data.password:
        changed_fields.append(
            "Password updated"
        )

    # ------------------------------------
    # SAVE
    # ------------------------------------

    employee = update_employee_repo(
        db,
        employee
    )

    if profile_created:
        action = "CREATE"
        notes = (
        f"Created employee profile "
        f"'{employee.email}'."
        )
    else:
        action = "UPDATE"
        notes = (
        f"Updated employee '{employee.full_name}'. "
        f"Changes: "
        f"{', '.join(changed_fields) if changed_fields else 'No changes'}."
    )
    

    log_activity(
        db=db,
        created_by=performed_by,
        module="EMPLOYEE",
        action=action,
        item_type="EMPLOYEE",
        item_id=employee.id,
        item_name=employee.full_name,
        notes=notes
    )
    db.commit()
    db.refresh(employee)

    return {

    # AUTH USER
    "user_id": auth_user.id,
    "email": auth_user.email,
    "role": auth_user.role,
    "is_active": auth_user.is_active,
    "is_verified": auth_user.is_verified,
    "is_approved": auth_user.is_approved,

    # EMPLOYEE
    "employee_id": employee.id,
    "employee_code": employee.employee_code,
    "full_name": employee.full_name,
    "phone": employee.phone,
    "department": employee.department,
    "designation": employee.designation,
    "status": employee.status,

    # EXTRA

    "login_enabled": auth_user.is_active,
    "created_at": auth_user.created_at
    }



def delete_employee_service(
    db,
    user_id,
    performed_by
):

    employee = (
        get_employee_by_auth_user_id_repo(
            db,
            user_id
        )
    )

    if not employee:

        raise HTTPException(
            status_code=404,
            detail="Employee profile not found"
        )

    employee.is_deleted = True

    if employee.auth_user:

        employee.auth_user.is_active = False

    update_employee_repo(
        db,
        employee
    )

    log_activity(
        db=db,
        created_by=performed_by,
        module="EMPLOYEE",
        action="DELETE",
        item_type="EMPLOYEE",
        item_id=employee.id,
        item_name=employee.full_name,
        notes=(
            f"Deleted employee '{employee.full_name}' "
            f"(Code: {employee.employee_code})."
        )
    )

    db.commit()

    return {
        "message":
        "Employee deleted successfully"
    }