from sqlalchemy.orm import Session
from app.models.employee_model import Employee
from app.models.auth_model import AuthUser

# 🔹 GET PROFILE BY AUTH USER
def get_profile_by_auth_user(
    db: Session,
    auth_user_id: int
):

    return (
        db.query(Employee)
        .filter(
            Employee.auth_user_id ==
            auth_user_id,

            Employee.is_deleted == False
        )
        .first()
    )


def update_profile(
    employee,
    data,
    profile_image=None
):

    if data.full_name is not None:
        employee.full_name = data.full_name
   
    if data.phone is not None:
        employee.phone = data.phone

    if profile_image:
        employee.profile_image = (
            profile_image
        )

    return employee



# 🔹 GET AUTH USER
def get_auth_user_by_id(
    db,
    auth_user_id
):

    return (
        db.query(AuthUser)
        .filter(
            AuthUser.id ==
            auth_user_id
        )
        .first()
    )