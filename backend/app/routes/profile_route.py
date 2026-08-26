

from fastapi import APIRouter, Depends,UploadFile, File,HTTPException
from sqlalchemy.orm import Session
import os
from fastapi.responses import FileResponse
from app.core.config import settings

from app.db.database import get_asset_db
from app.schemas.profile_schema import UpdateProfileSchema,ChangePasswordSchema

from app.services.profile_service import (
    # get_my_profile_service,
    update_profile_service,
    change_password_service
)


from app.core.dependencies import get_current_user

from app.models.auth_model import AuthUser
from app.models.employee_model import Employee


router = APIRouter(
    prefix="/apiV3/profile",
    tags=["Profile"]
)



# ==========================================================
# GET MY PROFILE
# ==========================================================

@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):

    employee = (
        db.query(Employee)
        .filter(
            Employee.auth_user_id == current_user.id,
            Employee.is_deleted == False
        )
        .first()
    )

    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "is_approved": current_user.is_approved,

        "employee_id": employee.id if employee else None,
        "employee_code": employee.employee_code if employee else None,
        "full_name": employee.full_name if employee else None,
        "phone": employee.phone if employee else None,
        "department": employee.department if employee else None,
        "designation": employee.designation if employee else None,
        "status": employee.status if employee else None,
        "login_enabled": current_user.is_active,
        "created_at": current_user.created_at
    }


@router.get("/image/{filename:path}")
def get_profile_image(filename: str):

    file_path = os.path.join(
        settings.UPLOAD_DIR,
        "profile",
        filename
    )

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )

    return FileResponse(file_path)

# #  GET MY PROFILE
# @router.get("/me")
# def get_my_profile(
#     auth_user_id: int,
#     db: Session = Depends(get_asset_db)
# ):

#     return get_my_profile_service(
#         db,
#         auth_user_id
#     )

# ==========================================================
# UPDATE MY PROFILE
# ==========================================================

@router.put("/me")
def update_my_profile(

    data: UpdateProfileSchema = Depends(),

    image: UploadFile = File(None),

    db: Session = Depends(get_asset_db),

    current_user: AuthUser = Depends(get_current_user)
):

    return update_profile_service(
        db,
        current_user.id,
        data,
        image
    )



# ==========================================================
# CHANGE PASSWORD
# ==========================================================

@router.put("/change-password")
def change_password(

    data: ChangePasswordSchema,

    db: Session = Depends(get_asset_db),

    current_user: AuthUser = Depends(get_current_user)
):

    return change_password_service(
        db,
        current_user.id,
        data
    )