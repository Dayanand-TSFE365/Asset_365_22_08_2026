from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repository.job_qr_repo import (
    get_job_for_qr_repo,
    get_sub_jobs_for_qr_repo,
    get_as_build_files_for_sub_job_repo
)

from app.services.job_permission_check_service import (
    check_view_file_permission
)


def get_job_qr_files_service(
    db: Session,
    job_id: int,
    current_user
):
    # --------------------------------
    # 1. Check Job
    # --------------------------------

    job = get_job_for_qr_repo(
        db,
        job_id
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    # --------------------------------
    # 2. Check VIEW FILE permission
    # --------------------------------

    check_view_file_permission(
        db=db,
        job_id=job_id,
        user_id=current_user.id
    )

    # --------------------------------
    # 3. Get Sub Jobs
    # --------------------------------

    sub_jobs = get_sub_jobs_for_qr_repo(
        db,
        job_id
    )

    result = []

    # --------------------------------
    # 4. Get AS-BUILD files
    # --------------------------------

    for sub_job in sub_jobs:

        files = get_as_build_files_for_sub_job_repo(
            db,
            sub_job.sub_job_id
        )

        file_list = []

        for file in files:

            file_list.append(
                {
                    "file_id": file.file_id,
                    "original_file_name": file.original_file_name,
                    "file_size": file.file_size,
                    "uploaded_at": file.uploaded_at,
                    "uploaded_by": file.uploaded_by,

                    # Frontend can use this
                    # for preview
                    "view_url":
                        f"/apiV3/job-qr/file/{file.file_id}/view",

                    # Frontend should call this
                    # only when user clicks Download
                    "download_url":
                        f"/apiV3/job-qr/file/{file.file_id}/download"
                }
            )

        result.append(
            {
                "sub_job_id": sub_job.sub_job_id,
                "sub_job_no": sub_job.sub_job_no,
                "panel_description": sub_job.panel_description,
                "files": file_list
            }
        )

    return {
        "job_id": job.job_id,
        "job_no": job.job_no,
        "customer_name": job.customer_name,
        "can_download": True,
        "sub_jobs": result
    }