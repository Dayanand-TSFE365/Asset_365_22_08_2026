from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.core.admin_require import require_admin

from app.schemas.employee_schema import (
    EmployeeListResponse,
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate
)

from app.services.employee_service import (
    get_all_employees_service,
    create_employee_service,
    update_employee_service,
    delete_employee_service,
    get_deleted_employees_service
)

router = APIRouter(
    prefix="/apiV3/employees",
    tags=["Employees"]
)


# -----------------------------------------
# GET ALL EMPLOYEES
# -----------------------------------------

@router.get(
    "/",
    response_model=list[EmployeeListResponse]
)
def get_all_employees(

    db: Session = Depends(get_asset_db),

    # current_user=Depends(require_admin)

):

    return get_all_employees_service(db)


# -----------------------------------------
# CREATE EMPLOYEE
# -----------------------------------------

@router.post(
    "/",
    response_model=EmployeeResponse
)
def create_employee(

    data: EmployeeCreate,

    db: Session = Depends(get_asset_db),

    current_user=Depends(require_admin)
):

    return create_employee_service(
        db,
        data,
        current_user.id
    )


# -----------------------------------------
# UPDATE EMPLOYEE
# -----------------------------------------

# @router.put("/{employee_id}")
# def update_employee(

#     employee_id: int,

#     data: EmployeeUpdate,

#     db: Session = Depends(get_asset_db),

#     current_user=Depends(require_admin)
# ):

#     return update_employee_service(
#         db,
#         employee_id,
#         data,
#         current_user.id
#     )

@router.put("/{user_id}",response_model=EmployeeResponse)
def update_employee(

    user_id: int,

    data: EmployeeUpdate,

    db: Session = Depends(get_asset_db),

    current_user=Depends(require_admin)
):

    return update_employee_service(
        db,
        user_id,
        data,
        current_user.id
    )
# -----------------------------------------
# DELETE EMPLOYEE
# -----------------------------------------

# @router.delete("/{employee_id}")
# def delete_employee(

#     employee_id: int,

#     db: Session = Depends(get_asset_db),

#     current_user=Depends(require_admin)
# ):

#     return delete_employee_service(
#         db,
#         employee_id,
#         current_user.id
#     )
@router.delete("/{user_id}")
def delete_employee(

    user_id: int,

    db: Session = Depends(get_asset_db),

    current_user=Depends(require_admin)
):

    return delete_employee_service(
        db,
        user_id,
        current_user.id
    )

# -----------------------------------------
# GET DELETED EMPLOYEES
# -----------------------------------------

@router.get("/deleted/list", response_model=list[EmployeeListResponse])
def get_deleted_employees(

    db: Session = Depends(get_asset_db),

    current_user=Depends(require_admin)
):

    return get_deleted_employees_service(db)