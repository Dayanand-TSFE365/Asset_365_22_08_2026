

from fastapi import APIRouter, Depends,UploadFile, File,HTTPException
from sqlalchemy.orm import Session
import os
from fastapi.responses import FileResponse
from app.core.config import settings

from app.db.database import get_asset_db
from app.schemas.profile_schema import UpdateProfileSchema,ChangePasswordSchema

from app.services.profile_service import (
    get_my_profile_service,
    update_profile_service,
    change_password_service
)




router = APIRouter(
    prefix="/apiV3/profile",
    tags=["Profile"]
)


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

#  GET MY PROFILE
@router.get("/me")
def get_my_profile(
    auth_user_id: int,
    db: Session = Depends(get_asset_db)
):

    return get_my_profile_service(
        db,
        auth_user_id
    )

@router.put("/me")
def update_my_profile(

    auth_user_id: int,

    data: UpdateProfileSchema = Depends(),

    image: UploadFile = File(None),

    db: Session = Depends(get_asset_db)
):

    return update_profile_service(
        db,
        auth_user_id,
        data,
        image
    )

@router.put("/change-password")
def change_password(

    auth_user_id: int,

    data: ChangePasswordSchema,

    db: Session = Depends(get_asset_db)
):

    return change_password_service(
        db,
        auth_user_id,
        data
    )