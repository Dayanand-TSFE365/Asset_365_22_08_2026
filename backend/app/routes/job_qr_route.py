import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.core.dependencies import (
    get_current_user
)

from app.models.auth_model import AuthUser

from app.services.job_qr_service import (
    get_job_qr_files_service
)

from app.repository.job_file_new_repo import (
    get_job_file_by_id_repo,
    get_sub_job_repo
)

from app.services.job_permission_check_service import (
    check_view_file_permission,
    check_download_permission
)


router = APIRouter(
    prefix="/apiV3/job-qr",
    tags=["Job QR"]
)


@router.get(
    "/job/{job_id}"
)
def get_job_qr_files(
    job_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):
    try:

        return get_job_qr_files_service(
            db=db,
            job_id=job_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get(
    "/file/{file_id}/view"
)
def view_qr_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
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

    if job_file.file_type != "AS_BUILD":
        raise HTTPException(
            status_code=403,
            detail="Only AS-BUILD files can be viewed through QR."
        )

    sub_job = get_sub_job_repo(
        db,
        job_file.sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Sub job not found."
        )

    # --------------------------------
    # VIEW permission
    # --------------------------------

    check_view_file_permission(
        db=db,
        job_id=sub_job.job_id,
        user_id=current_user.id
    )

    # --------------------------------
    # Physical file
    # --------------------------------

    if not os.path.exists(
        job_file.file_path
    ):
        raise HTTPException(
            status_code=404,
            detail="Physical file not found."
        )

    # --------------------------------
    # IMPORTANT
    # inline = browser preview
    # --------------------------------

    return FileResponse(
        path=job_file.file_path,
        filename=job_file.original_file_name,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'inline; filename="{job_file.original_file_name}"'
        }
    )

@router.get(
    "/file/{file_id}/download"
)
def download_qr_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
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

    if job_file.file_type != "AS_BUILD":
        raise HTTPException(
            status_code=403,
            detail="Only AS-BUILD files can be downloaded through QR."
        )

    sub_job = get_sub_job_repo(
        db,
        job_file.sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Sub job not found."
        )

    # --------------------------------
    # DOWNLOAD permission
    # --------------------------------

    check_download_permission(
        db=db,
        job_id=sub_job.job_id,
        user_id=current_user.id
    )

    # --------------------------------
    # Physical file
    # --------------------------------

    if not os.path.exists(
        job_file.file_path
    ):
        raise HTTPException(
            status_code=404,
            detail="Physical file not found."
        )

    return FileResponse(
        path=job_file.file_path,
        filename=job_file.original_file_name,
        media_type="application/octet-stream"
    )