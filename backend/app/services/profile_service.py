

from app.services.activity_log_service import log_activity
from fastapi import HTTPException
import os
import shutil
from uuid import uuid4
from app.repository.profile_repo import (
    get_profile_by_auth_user,
    update_profile
)
from app.core.config import settings

from app.repository.profile_repo import (
    get_auth_user_by_id
)
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# UPLOAD_FOLDER = "uploads/profile"

#  GET MY PROFILE
def get_my_profile_service(
    db,
    auth_user_id
):

    employee = get_profile_by_auth_user(
        db,
        auth_user_id
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return employee







def update_profile_service(
    db,
    auth_user_id,
    data,
    image=None
):

    employee = get_profile_by_auth_user(
        db,
        auth_user_id
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    image_path = None

    if image:

        upload_folder = os.path.join(
            settings.UPLOAD_DIR,
            "profile"
        )

        os.makedirs(
            upload_folder,
            exist_ok=True
        )

        filename = f"{uuid4()}_{image.filename}"

        file_path = os.path.join(
            upload_folder,
            filename
        )

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                image.file,
                buffer
            )

        # Save relative path in DB
        image_path = f"uploads/profile/{filename}"


    #  UPDATE PROFILE
    employee = update_profile(
        employee,
        data,
        image_path
    )

    #  SAVE
    db.commit()

    db.refresh(employee)

    changed_fields = []

    if data.full_name and data.full_name != employee.full_name:
        changed_fields.append(
            f"Full Name → {data.full_name}"
        )

    if data.phone and data.phone != employee.phone:
        changed_fields.append(
            f"Phone → {data.phone}"
        )


    if image:
        changed_fields.append("Profile image updated")

    log_activity(
    db=db,
    created_by=auth_user_id,
    module="PROFILE",
    action="UPDATE",
    item_type="PROFILE",
    item_id=employee.id,
    item_name=employee.full_name,
    notes=(
        f"Updated profile. "
        f"Changes: {', '.join(changed_fields)}."
    )
)

    return employee



#  CHANGE PASSWORD
def change_password_service(
    db,
    auth_user_id,
    data
):

    user = get_auth_user_by_id(
        db,
        auth_user_id
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    #  VERIFY OLD PASSWORD
    valid_password = pwd_context.verify(
        data.old_password,
        user.password_hash
    )

    if not valid_password:
        raise HTTPException(
            status_code=400,
            detail="Old password incorrect"
        )

    #  CHECK PASSWORD MATCH
    if (
        data.new_password !=
        data.confirm_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )

    #  HASH NEW PASSWORD
    hashed_password = pwd_context.hash(
        data.new_password
    )

    #  UPDATE PASSWORD
    user.password_hash = hashed_password

    db.commit()

    log_activity(
    db=db,
    created_by=auth_user_id,
    module="PROFILE",
    action="CHANGE_PASSWORD",
    item_type="PROFILE",
    item_id=user.id,
    item_name=user.email,
    notes="Changed account password."
)

    return {
        "message":
        "Password changed successfully"
    }