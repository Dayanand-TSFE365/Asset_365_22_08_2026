from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException
)
import traceback

from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_asset_db
from app.models.auth_model import AuthUser

from app.core.job_permission import require_job_permission

from app.schemas.job_schema import (
    MultipleUploadResponseSchema
)

from app.schemas.job_file_new_schema import (
    JobFileNewResponseSchema
)

from app.services.job_file_new_service import (
    upload_job_file_service,
    get_job_files_service,
    get_job_file_by_id_service,
    delete_job_file_service,
    download_job_file_service,
    get_deleted_job_files_service,
    restore_job_file_service,
    permanently_delete_job_file_service
)

router = APIRouter(
    prefix="/apiV3/job-files-new",
    tags=["Job Files New"]
)


@router.post(
    "/upload/{sub_job_id}",
    response_model=MultipleUploadResponseSchema
)

async def upload_job_files(
    sub_job_id: int,
    file_type: str = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):
    try:
        return await upload_job_file_service(
            db=db,
            sub_job_id=sub_job_id,
            file_type=file_type,
            files=files,
            current_user=current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/sub-job/{sub_job_id}",
    response_model=list[JobFileNewResponseSchema]
)
def get_job_files(
    sub_job_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(
        get_current_user
    )
):
    print("Reached get_job_files:", sub_job_id)
    try:
        return get_job_files_service(
            db=db,
            sub_job_id=sub_job_id,
            current_user=current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# =========================================================
# GET DELETED JOB FILES
# =========================================================

@router.get(
    "/deleted",
    response_model=list[JobFileNewResponseSchema]
)
def get_deleted_job_files(
    db: Session = Depends(get_asset_db),
    # current_user: AuthUser = Depends(get_current_user)
):
    try:
        return get_deleted_job_files_service(
            db=db,
            # current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)

        )
    




@router.get(
    "/download/{file_id}"
)
def download_job_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(
        get_current_user
    )

):
    try:
        job_file = download_job_file_service(
            db,
            file_id,
            current_user
        )

        return FileResponse(
            path=job_file.file_path,
            filename=job_file.original_file_name,
            media_type="application/octet-stream"
        )

    except Exception:
        traceback.print_exc()
        raise


# RESTORE JOB FILE
# =========================================================

@router.patch(
    "/{file_id}/restore"
)
def restore_job_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):
    try:
        return restore_job_file_service(
            db=db,
            file_id=file_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# PERMANENT DELETE JOB FILE
# =========================================================

@router.delete(
    "/{file_id}/permanent"
)
def permanently_delete_job_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):
    try:
        return permanently_delete_job_file_service(
            db=db,
            file_id=file_id,
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
    "/{file_id}",
    response_model=JobFileNewResponseSchema
)
def get_job_file(
    file_id: int,
    db: Session = Depends(get_asset_db)
):
    try:
        return get_job_file_by_id_service(
            db,
            file_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

    
@router.delete(
    "/{file_id}"
)
def delete_job_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(
        get_current_user
    )
):
    try:
        return delete_job_file_service(
            db,
            file_id,
            current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )