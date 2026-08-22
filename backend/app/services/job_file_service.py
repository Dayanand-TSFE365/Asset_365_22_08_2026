import os
import shutil
import uuid
from app.core.config import settings
from fastapi import UploadFile
from app.core.dependencies import get_current_user
import re
from app.models.job_file_model import JobFile
from app.repository.job_file_repo import (
    create_job_file_repo,
    get_job_files_repo,
    get_job_file_by_id_repo,
    delete_job_file_repo,
    get_job_repo,
    update_document_status_repo,
    count_file_type_repo
)
from app.services.activity_log_service import log_activity


DOCUMENT_MAPPING = {
    "AS_BUILD": "as_build",
    "SOFT_COPY": "soft_copy",
    "HARD_COPY": "hard_copy",
    # "PROJECT_DETAILS": "project_details",
    "FACTORY_TEST_REPORT": "factory_test_report",
    # "SITE_COMMISSIONED": "site_commissioned",
    # "BOM": "bom",
    "BOM_EXCEL": "bom_excel",
    "BOM_PDF": "bom_pdf",
    "PHOTOS": "photos",
    "BACKUP": "backup_file",
    "MOM": "mom_uploaded"
    
}

FOLDER_MAPPING = {
    "AS_BUILD": "Drawing",
    "SOFT_COPY": "Soft Copy",
    "HARD_COPY": "Hard Copy",
    "FACTORY_TEST_REPORT": "Factory Test Report",
    # "BOM": "BOM",
    "BOM_EXCEL": "BOM",
    "BOM_PDF": "BOM",
    "PHOTOS": "Photos",
    "BACKUP": "Backup",
    "MOM": "Minutes Of Meeting"
}

def upload_job_file_service(
    db,
    job_id: int,
    file_type: str,
    files: list[UploadFile],
    current_user
):
    job = get_job_repo(
        db,
        job_id
    )
    username = current_user.email.split("@")[0]

    username = re.sub(
    r"[^a-zA-Z0-9_-]",
    "_",
    username
    )

    user_folder = f"{current_user.id}_{username}"

    if not job:
        raise Exception(
            "Job not found."
        )

    if file_type not in DOCUMENT_MAPPING:
        raise Exception(
            "Invalid file type."
        )
    
    if not files:
        raise Exception(
            "No files uploaded."
        )

    sub_folder = FOLDER_MAPPING[file_type]

    # folder = os.path.join(
    #     settings.UPLOAD_DIR,
    #     "jobs",
    #     job.job_no,
    #     sub_folder
    # )
    folder = os.path.join(
    settings.UPLOAD_DIR,
    "jobs",
    job.job_no,
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

            job_file = JobFile(
                job_id=job_id,
                file_type=file_type,
                original_file_name=file.filename,
                stored_file_name=unique_name,
                file_path=file_path,
                file_size=file_size,
                uploaded_by=current_user.id
            )

            job_file = create_job_file_repo(
                db,
                job_file
            )

            uploaded_files.append(
                {
                    "file_id":
                        job_file.file_id,
                    "original_file_name":
                        job_file.original_file_name,
                    "stored_file_name":
                        job_file.stored_file_name,
                    "file_type":
                        job_file.file_type,
                    "file_size":
                        job_file.file_size
                }
            )

        if uploaded_files:
            field_name = DOCUMENT_MAPPING[
                file_type
            ]

            update_document_status_repo(
                db,
                job_id,
                field_name,
                True
            )
        if uploaded_files:
            log_activity(
                db=db,
                created_by=current_user.id,
                module="JOB",
                action="UPLOAD_FILE",
                item_type="JOB_FILE",
                item_id=job.job_id,
                item_name=job.job_no,
                quantity=len(uploaded_files),
                notes=(
                f"Uploaded {len(uploaded_files)} "
                f"{file_type} file(s) "
                f"for Job '{job.job_no}'."
                ),
                changes={
                    "file_type": file_type,
                    "files": [
                    f["original_file_name"]
                    for f in uploaded_files
                    ]
                }
                )

        return {
            "message":
                "Files uploaded successfully.",
            "total_files":
                len(uploaded_files),
            "files":
                uploaded_files
        }

    except Exception as e:
        raise Exception(
            str(e)
        )


def get_job_files_service(
    db,
    job_id: int
):
    job = get_job_repo(
        db,
        job_id
    )

    if not job:
        raise Exception(
            "Job not found."
        )

    return get_job_files_repo(
        db,
        job_id
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
):
    job_file = get_job_file_by_id_repo(
        db,
        file_id
    )
    job = get_job_repo(
    db,
    job_id
)

    if not job_file:
        raise Exception(
            "File not found."
        )

    file_type = job_file.file_type
    job_id = job_file.job_id

    if (
    job_file.file_path
    and os.path.exists(job_file.file_path)
    ):
        os.remove(job_file.file_path)


    log_activity(
        db=db,
        created_by=job_file.uploaded_by,
        module="JOB",
        action="DELETE_FILE",
        item_type="JOB_FILE",
        item_id=job_file.file_id,
        item_name=job_file.original_file_name,
        notes=(
            f"Deleted '{job_file.original_file_name}' "
            f"({job_file.file_type}) "
            f"from Job '{job.job_no}'."
        )
    )
    delete_job_file_repo(
        db,
        job_file
    )

    remaining_files = (
        count_file_type_repo(
            db,
            job_id,
            file_type
        )
    )

    if remaining_files == 0:
        field_name = (
            DOCUMENT_MAPPING[
                file_type
            ]
        )

        update_document_status_repo(
            db,
            job_id,
            field_name,
            False
        )

    return {
        "message":
        "File deleted successfully."
    }


def download_job_file_service(
    db,
    file_id: int
):
    job_file = get_job_file_by_id_repo(
        db,
        file_id
    )
    job = get_job_repo(
        db,
        job_file.job_id
    )

    if not job_file:
        raise Exception(
            "File not found."
        )

    if not os.path.exists(
        job_file.file_path
    ):
        
        raise Exception(
            "Physical file not found."
        )


    return job_file