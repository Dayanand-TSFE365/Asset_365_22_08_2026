import os
import shutil

from fastapi import UploadFile, HTTPException

from app.models.client_license_file_model import LicenseFile
from app.core.config import settings
from app.services.activity_log_service import log_activity
from app.repository.client_license_file_repo import (
    create_license_file_repo,
    get_license_files_repo,
    get_license_file_by_id_repo,
    delete_license_file_repo,
    get_license_repo,
    get_license_file_status_repo,
    get_deleted_license_files_repo,
    restore_license_file_repo,
    permanently_delete_license_file_repo,
    get_deleted_license_file_by_id_repo
)


def upload_license_file_service(
    db,
    license_id: int,
    files: list[UploadFile],
    uploaded_by: int
):
    license = get_license_repo(
        db,
        license_id
    )

    if not license:
        raise HTTPException(
            status_code=404,
            detail="License not found."
        )

    if not files:
        raise HTTPException(
            status_code=400,
            detail="No files uploaded."
        )

    folder = os.path.join(
        settings.UPLOAD_DIR,
        "licenses",
        str(license_id)
    )

    os.makedirs(
        folder,
        exist_ok=True
    )

    uploaded_files = []

    try:

        for file in files:

            if not file.filename:
                continue

            unique_name = file.filename

            base, ext = os.path.splitext(
                unique_name
            )

            counter = 1

            while os.path.exists(
                os.path.join(
                    folder,
                    unique_name
                )
            ):
                unique_name = (
                    f"{base}_{counter}{ext}"
                )

                counter += 1

            file_path = os.path.join(
                folder,
                unique_name
            )

            with open(
                file_path,
                "wb"
            ) as buffer:

                shutil.copyfileobj(
                    file.file,
                    buffer
                )

            file_size = os.path.getsize(
                file_path
            )

            license_file = LicenseFile(
                license_id=license_id,
                original_file_name=file.filename,
                stored_file_name=unique_name,
                file_path=file_path,
                file_size=file_size,
                uploaded_by=uploaded_by
            )

            license_file = create_license_file_repo(
                db,
                license_file
            )

            uploaded_files.append(
                {
                    "file_id":
                        license_file.file_id,

                    "original_file_name":
                        license_file.original_file_name,

                    "stored_file_name":
                        license_file.stored_file_name,

                    "file_size":
                        license_file.file_size
                }
            )

        # ----------------------------------
        # ACTIVITY LOG
        # ----------------------------------

        if uploaded_files:

            log_activity(
                db=db,
                created_by=uploaded_by,
                module="CLIENT_LICENSE",
                action="UPLOAD_FILES",
                item_type="LICENSE",
                item_id=license.license_id,
                item_name=license.product_name,
                notes=(
                    f"Uploaded "
                    f"{len(uploaded_files)} file(s) "
                    f"for license "
                    f"'{license.product_name}'."
                ),
                changes={
                    "file_count": len(uploaded_files),
                    "file_names": [
                        file["original_file_name"]
                        for file in uploaded_files
                    ]
                }
            )

        db.commit()

        return {
            "message":
                "Files uploaded successfully.",

            "total_files":
                len(uploaded_files),

            "files":
                uploaded_files
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



def get_license_files_service(
    db,
    license_id: int
):
    license = get_license_repo(
        db,
        license_id
    )

    if not license:
        raise HTTPException(
            status_code=404,
            detail="License not found."
        )

    return get_license_files_repo(
        db,
        license_id
    )


def get_license_file_by_id_service(
    db,
    file_id: int
):
    license_file = get_license_file_by_id_repo(
        db,
        file_id
    )

    if not license_file:
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    return license_file

def get_license_file_status_service(db):
    return get_license_file_status_repo(db)


def download_license_file_service(
    db,
    file_id: int,
    current_user
):
    license_file = get_license_file_by_id_repo(
        db,
        file_id
    )

    if not license_file:
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    if not os.path.exists(
        license_file.file_path
    ):
        raise HTTPException(
            status_code=404,
            detail="Physical file not found."
        )
    
    log_activity(
        db=db,
        created_by=current_user.id,
        module="CLIENT_LICENSE",
        action="DOWNLOAD_FILE",
        item_type="LICENSE_FILE",
        item_id=license_file.file_id,
        item_name=license_file.original_file_name,
        notes=(
            f"Downloaded file "
            f"'{license_file.original_file_name}' "
            f"for license '{license_file.license.product_name}'."
        )

        )

    return license_file


# =========================================================
# SOFT DELETE
# =========================================================

def delete_license_file_service(
    db,
    file_id: int,
    current_user
):
    license_file = get_license_file_by_id_repo(
        db,
        file_id
    )

    if not license_file:
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    # IMPORTANT:
    # Do NOT remove physical file here.
    # We need it for restore.

    delete_license_file_repo(
        db,
        license_file
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="CLIENT_LICENSE",
        action="DELETE_FILE",
        item_type="LICENSE_FILE",
        item_id=license_file.file_id,
        item_name=license_file.original_file_name,
        notes=(
            f"Deleted file "
            f"'{license_file.original_file_name}' "
            f"from license "
            f"'{license_file.license.product_name}'."
        )
    )

    db.commit()

    return {
        "message":
            "File deleted successfully."
    }



# =========================================================
# GET DELETED FILES
# =========================================================

def get_deleted_license_files_service(
    db,
    # current_user
):
    # if current_user.role.lower() != "superadmin":
    #     raise HTTPException(
    #         status_code=403,
    #         detail=(
    #             "Only SuperAdmin can view "
    #             "deleted license files."
    #         )
    #     )

    return get_deleted_license_files_repo(db)




# =========================================================
# RESTORE FILE
# =========================================================

def restore_license_file_service(
    db,
    file_id: int,
    current_user
):
    if current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only SuperAdmin can restore "
                "license files."
            )
        )

    license_file = (
        get_deleted_license_file_by_id_repo(
            db,
            file_id
        )
    )

    if not license_file:
        raise HTTPException(
            status_code=404,
            detail="Deleted license file not found."
        )

    # Physical file must still exist
    if (
        not license_file.file_path
        or not os.path.exists(
            license_file.file_path
        )
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Physical file not found. "
                "Cannot restore the file."
            )
        )

    restore_license_file_repo(
        db,
        license_file
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="CLIENT_LICENSE",
        action="RESTORE_FILE",
        item_type="LICENSE_FILE",
        item_id=license_file.file_id,
        item_name=license_file.original_file_name,
        notes=(
            f"Restored file "
            f"'{license_file.original_file_name}' "
            f"for license "
            f"'{license_file.license.product_name}'."
        )
    )

    db.commit()

    return {
        "message":
            "License file restored successfully.",

        "file_id":
            license_file.file_id
    }


# =========================================================
# PERMANENT DELETE
# =========================================================

def permanently_delete_license_file_service(
    db,
    file_id: int,
    current_user
):
    if current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only SuperAdmin can permanently "
                "delete license files."
            )
        )

    license_file = (
        get_deleted_license_file_by_id_repo(
            db,
            file_id
        )
    )

    if not license_file:
        raise HTTPException(
            status_code=404,
            detail=(
                "Deleted license file not found."
            )
        )

    deleted_file_id = license_file.file_id
    file_name = license_file.original_file_name

    license_name = (
        license_file.license.product_name
        if license_file.license
        else None
    )

    # ----------------------------------
    # DELETE PHYSICAL FILE
    # ----------------------------------

    if (
        license_file.file_path
        and os.path.exists(
            license_file.file_path
        )
    ):
        os.remove(
            license_file.file_path
        )

    # ----------------------------------
    # ACTIVITY LOG
    # ----------------------------------

    log_activity(
        db=db,
        created_by=current_user.id,
        module="CLIENT_LICENSE",
        action="PERMANENT_DELETE_FILE",
        item_type="LICENSE_FILE",
        item_id=deleted_file_id,
        item_name=file_name,
        notes=(
            f"Permanently deleted file "
            f"'{file_name}' "
            f"from license "
            f"'{license_name}'."
        )
    )

    # ----------------------------------
    # DELETE DB RECORD
    # ----------------------------------

    permanently_delete_license_file_repo(
        db,
        license_file
    )

    db.commit()

    return {
        "message":
            "License file permanently deleted successfully."
    }