from sqlalchemy.orm import Session
from app.models.employee_model import Employee
from app.models.auth_model import AuthUser
    
def get_all_people_repo(db):

    return (

        db.query(
            AuthUser,
            Employee
        )

        .outerjoin(
            Employee,
            AuthUser.id == Employee.auth_user_id
        )

        .filter(
            (Employee.is_deleted == False)
            | (Employee.id == None)
        )

        .all()
    )
def create_employee_repo(
    db,
    employee
):

    db.add(employee)

    db.flush()

    return employee



# def get_employee_by_id_repo(db, employee_id):

#     return (
#         db.query(Employee)
#         .filter(Employee.id == employee_id)
#         .first()
#     )
def get_employee_by_auth_user_id_repo(
    db,
    user_id
):

    return (

        db.query(Employee)

        .filter(
            Employee.auth_user_id == user_id,
            Employee.is_deleted == False
        )

        .first()
    )


def update_employee_repo(
    db,
    employee
):

    db.flush()
    return employee


def get_deleted_employees_repo(db: Session):

    return (
        db.query(Employee)
        .outerjoin(
            AuthUser,
            Employee.auth_user_id == AuthUser.id
        )
        .filter(Employee.is_deleted == True)
        .all()
    )