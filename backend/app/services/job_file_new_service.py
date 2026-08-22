
from importlib.resources import files
import os

from app.core.config import settings
from fastapi import UploadFile,HTTPException
from app.core.dependencies import get_current_user
from app.services.activity_log_service import log_activity
import re
from app.models.job_file_new_model import JobFileNew
from app.repository.job_file_new_repo import (
    create_job_file_repo,
    get_job_files_repo,
    get_job_file_by_id_repo,
    delete_job_file_repo,
    get_job_repo,
    get_sub_job_repo,
    update_document_status_repo,
    count_file_type_repo,

    get_deleted_job_files_repo,
    get_deleted_job_file_by_id_repo,
    restore_job_file_repo,
    permanently_delete_job_file_repo
)
from app.services.job_permission_check_service import check_upload_permission,check_view_file_permission,check_download_permission, check_delete_file_permission


DOCUMENT_MAPPING = {
    "AS_BUILD": "as_build",
    "SOFT_COPY": "soft_copy",
    "HARD_COPY": "hard_copy",
    "FACTORY_TEST_REPORT": "factory_test_report",
    "BOM_EXCEL": "bom_excel",
    "BOM_PDF": "bom_pdf",
    "PHOTOS": "photos",


    # "BACKUP": "backup_file",

    "PLC_BACKUP": "backup_file",
    "SCADA_BACKUP": "backup_file",
    "OTHER_BACKUP": "backup_file",

    "NOTES_AND_TECH_NOTE": "notes_and_tech_note",
    "ADDITIONAL_DATA": "additional_data",


    "MOM": "mom_uploaded"
    
}

FOLDER_MAPPING = {
    "AS_BUILD": "Drawing",
    "SOFT_COPY": "Soft Copy",
    "HARD_COPY": "Hard Copy",
    "FACTORY_TEST_REPORT": "Factory Test Report",
    "BOM_EXCEL": "BOM",
    "BOM_PDF": "BOM",


    "PLC_BACKUP": "Backup/PLC",
    "SCADA_BACKUP": "Backup/SCADA",
    "OTHER_BACKUP": "Backup/Other",

    "NOTES_AND_TECH_NOTE": "Notes & Tech Note",
    "ADDITIONAL_DATA": "Additional Data",

    "PHOTOS": "Photos",
    "BACKUP": "Backup",
    "MOM": "Minutes Of Meeting"
}


async def save_upload_file(
    upload_file: UploadFile,
    destination: str
):
    with open(destination, "wb") as buffer:
        while chunk := await upload_file.read(1024 * 1024):
            buffer.write(chunk)

    await upload_file.close()

async def upload_job_file_service(
    db,
    sub_job_id: int,
    file_type: str,
    files: list[UploadFile],
    current_user
):


    # ===========================
    # GET SUB JOB
    # ===========================

    sub_job = get_sub_job_repo(
        db,
        sub_job_id
    )

    if not sub_job:
        raise Exception(
            "Sub Job not found."
        )

    check_upload_permission(
    db=db,
    job_id=sub_job.job_id,
    user_id=current_user.id
    )

    # ===========================
    # GET PARENT JOB
    # ===========================

    job = get_job_repo(
        db,
        sub_job.job_id
    )

    if not job:
        raise Exception(
            "Job not found."
        )

    # ===========================
    # USER FOLDER
    # ===========================

    username = current_user.email.split("@")[0]

    username = re.sub(
        r"[^a-zA-Z0-9_-]",
        "_",
        username
    )

    user_folder = f"{current_user.id}_{username}"

    # ===========================
    # VALIDATIONS
    # ===========================

    if file_type not in DOCUMENT_MAPPING:
        raise Exception(
            "Invalid file type."
        )

    if not files:
        raise Exception(
            "No files uploaded."
        )

    sub_folder = FOLDER_MAPPING[file_type]

    # ===========================
    # CREATE DIRECTORY
    # ===========================

    folder = os.path.join(
        settings.UPLOAD_DIR,
        "jobs",
        job.job_no,
        sub_job.sub_job_no,
        sub_folder,
        user_folder
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

            # with open(
            #     file_path,
            #     "wb"
            # ) as buffer:

            #     shutil.copyfileobj(
            #         file.file,
            #         buffer
            #     )

            await save_upload_file(
                file,
                file_path
            )

            file_size = os.path.getsize(
                file_path
            )

            job_file = JobFileNew(

                sub_job_id=sub_job_id,

                file_type=file_type,

                original_file_name=file.filename,

                stored_file_name=unique_name,

                file_path=file_path,

                file_size=file_size,

                uploaded_by=current_user.id
            )
            job = get_job_repo(
                db,
                sub_job.job_id
            )

            job_file = create_job_file_repo(
                db,
                job_file
            )

            log_activity(
                db=db,
                created_by=current_user.id,
                module="JOB",
                action="UPLOAD_FILE",
                item_type="JOB_FILE",
                item_id=job_file.file_id,
                item_name=job_file.original_file_name,
                notes=(
                f"Uploaded '{job_file.original_file_name}' "
                f"({file_type}) for Job '{job.job_no}' "
                f"/ Sub Job '{sub_job.sub_job_no}'."
            )
            )

            uploaded_files.append(

                {
                    "file_id": job_file.file_id,

                    "original_file_name": job_file.original_file_name,

                    "stored_file_name": job_file.stored_file_name,

                    "file_type": job_file.file_type,

                    "file_size": job_file.file_size
                }

            )

        if uploaded_files:

            field_name = DOCUMENT_MAPPING[
                file_type
            ]

            update_document_status_repo(
                db,
                sub_job_id,
                field_name,
                True
            )

        return {

            "message": "Files uploaded successfully.",

            "total_files": len(uploaded_files),

            "files": uploaded_files

        }

    except Exception as e:

        raise Exception(
            str(e)
        )

def get_job_files_service(
    db,
    sub_job_id: int,
    current_user
):
    try:
        sub_job = get_sub_job_repo(
            db,
            sub_job_id
        )

        if not sub_job:
            raise HTTPException(
                status_code=404,
                detail="Sub Job not found."
            )

        check_view_file_permission(
            db=db,
            job_id=sub_job.job_id,
            user_id=current_user.id
        )


        files = get_job_files_repo(
            db,
            sub_job_id
        )

        return files

    except HTTPException:
        raise

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

def get_job_file_by_id_service(
    db,
    file_id: int
):
    job_file = get_job_file_by_id_repo(
        db,
        file_id
    )

    if not job_file:
        raise Exception(
            "File not found."
        )

    return job_file


def delete_job_file_service(
    db,
    file_id: int,
    current_user
):

    job_file = get_job_file_by_id_repo(
        db,
        file_id
    )

    if not job_file:
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    sub_job = get_sub_job_repo(
        db,
        job_file.sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Sub Job not found."
        )

    check_delete_file_permission(
        db=db,
        job_id=sub_job.job_id,
        user_id=current_user.id
    )

    job = get_job_repo(
        db,
        sub_job.job_id
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    file_type = job_file.file_type
    sub_job_id = job_file.sub_job_id

    # --------------------------------
    # SOFT DELETE
    # --------------------------------

    delete_job_file_repo(
        db,
        job_file
    )

    # --------------------------------
    # ACTIVITY LOG
    # --------------------------------

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="DELETE_FILE",
        item_type="JOB_FILE",
        item_id=job_file.file_id,
        item_name=job_file.original_file_name,
        notes=(
            f"Deleted '{job_file.original_file_name}' "
            f"({job_file.file_type}) "
            f"from Job '{job.job_no}' "
            f"/ Sub Job '{sub_job.sub_job_no}'."
        )
    )

    # --------------------------------
    # CHECK REMAINING ACTIVE FILES
    # --------------------------------

    remaining_files = count_file_type_repo(
        db,
        sub_job_id,
        file_type
    )

    if remaining_files == 0:

        field_name = DOCUMENT_MAPPING[file_type]

        update_document_status_repo(
            db,
            sub_job_id,
            field_name,
            False
        )

    db.commit()

    return {
        "message": "File deleted successfully."
    }


def get_deleted_job_files_service(
    db,
    # current_user
):

    files = get_deleted_job_files_repo(
        db
    )

    return files


def restore_job_file_service(
    db,
    file_id: int,
    current_user
):

    job_file = get_deleted_job_file_by_id_repo(
        db,
        file_id
    )

    if not job_file:
        raise HTTPException(
            status_code=404,
            detail="Deleted file not found."
        )

    sub_job = get_sub_job_repo(
        db,
        job_file.sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Sub Job not found."
        )

    job = get_job_repo(
        db,
        sub_job.job_id
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    # --------------------------------
    # RESTORE
    # --------------------------------

    restore_job_file_repo(
        db,
        job_file
    )

    # --------------------------------
    # UPDATE DOCUMENT STATUS
    # --------------------------------

    field_name = DOCUMENT_MAPPING.get(
        job_file.file_type
    )

    if field_name:

        update_document_status_repo(
            db,
            job_file.sub_job_id,
            field_name,
            True
        )

    # --------------------------------
    # ACTIVITY LOG
    # --------------------------------

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="RESTORE_FILE",
        item_type="JOB_FILE",
        item_id=job_file.file_id,
        item_name=job_file.original_file_name,
        notes=(
            f"Restored '{job_file.original_file_name}' "
            f"({job_file.file_type}) "
            f"to Job '{job.job_no}' "
            f"/ Sub Job '{sub_job.sub_job_no}'."
        )
    )

    db.commit()

    return {
        "message": "File restored successfully.",
        "file_id": job_file.file_id,
        "file_name": job_file.original_file_name
    }


def download_job_file_service(
    db,
    file_id: int,
    current_user
):
  

    job_file = get_job_file_by_id_repo(
        db,
        file_id
    )


    if not job_file:
        raise Exception("File not found.")

  
    sub_job = get_sub_job_repo(
        db,
        job_file.sub_job_id
    )

    if not sub_job:
        raise Exception("Sub Job not found.")

    job = get_job_repo(
            db,
            sub_job.job_id
        )

    if not job:
        raise Exception("Job not found.")

    

    check_download_permission(
        db=db,
        job_id=sub_job.job_id,
        user_id=current_user.id
    )


    if not os.path.exists(job_file.file_path):
        raise Exception("Physical file not found.")

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="DOWNLOAD_FILE",
        item_type="JOB_FILE",
        item_id=job_file.file_id,
        item_name=job_file.original_file_name,
        notes=(
        f"Downloaded '{job_file.original_file_name}' "
        f"({job_file.file_type}) "
        f"from Job '{job.job_no}' "
        f"/ Sub Job '{sub_job.sub_job_no}'."
)
    )

    return job_file


def permanently_delete_job_file_service(
    db,
    file_id: int,
    current_user
):

    job_file = get_deleted_job_file_by_id_repo(
        db,
        file_id
    )

    if not job_file:
        raise HTTPException(
            status_code=404,
            detail="Deleted file not found."
        )

    sub_job = get_sub_job_repo(
        db,
        job_file.sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Sub Job not found."
        )

    job = get_job_repo(
        db,
        sub_job.job_id
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    # Save values before deleting DB record
    file_name = job_file.original_file_name
    file_type = job_file.file_type
    file_id = job_file.file_id
    file_path = job_file.file_path

    # --------------------------------
    # PERMISSION
    # --------------------------------

    check_delete_file_permission(
        db=db,
        job_id=sub_job.job_id,
        user_id=current_user.id
    )

    # --------------------------------
    # ACTIVITY LOG
    # --------------------------------

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="PERMANENT_DELETE_FILE",
        item_type="JOB_FILE",
        item_id=file_id,
        item_name=file_name,
        notes=(
            f"Permanently deleted '{file_name}' "
            f"({file_type}) "
            f"from Job '{job.job_no}' "
            f"/ Sub Job '{sub_job.sub_job_no}'."
        )
    )

    # --------------------------------
    # DELETE DATABASE RECORD
    # --------------------------------

    permanently_delete_job_file_repo(
        db,
        job_file
    )

    # --------------------------------
    # DELETE PHYSICAL FILE
    # --------------------------------

    if (
        file_path
        and os.path.exists(file_path)
    ):
        os.remove(file_path)

    db.commit()

    return {
        "message": "File permanently deleted successfully.",
        "file_id": file_id,
        "file_name": file_name
    }