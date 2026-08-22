from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.schemas.job_sub_job_schema import (
    JobSubJobResponseSchema, 
    UpdateSubJobSchema
)

from app.services.job_sub_job_service import (
    get_sub_job_by_id_service, 
    update_sub_job_service,
    delete_sub_job_service,
    get_deleted_sub_jobs_service,
    restore_sub_job_service,
    permanently_delete_sub_job_service
)

from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/apiV3/sub-jobs",
    tags=["Sub Jobs"]
)

# ==========================================================

@router.get(
    "/deleted",
    response_model=list[JobSubJobResponseSchema]
)
def get_deleted_sub_jobs(
    db: Session = Depends(get_asset_db),
    # current_user=Depends(get_current_user)
):
    try:
        return get_deleted_sub_jobs_service(
            db=db
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================================
# GET ACTIVE SUB JOB
# ==========================================================

@router.get(
    "/{sub_job_id}",
    response_model=JobSubJobResponseSchema
)
def get_sub_job(
    sub_job_id: int,
    db: Session = Depends(get_asset_db)
):
    try:
        return get_sub_job_by_id_service(
            db=db,
            sub_job_id=sub_job_id
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================================
# GET ALL DELETED SUB JOBS
# IMPORTANT: Keep this BEFORE /{sub_job_id}



# ==========================================================
# RESTORE SUB JOB
# ==========================================================

@router.patch(
    "/{sub_job_id}/restore"
)
def restore_sub_job(
    sub_job_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return restore_sub_job_service(
            db=db,
            sub_job_id=sub_job_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================================
# UPDATE SUB JOB
# ==========================================================

@router.put(
    "/{sub_job_id}",
    response_model=JobSubJobResponseSchema
)
def update_sub_job(
    sub_job_id: int,
    payload: UpdateSubJobSchema,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return update_sub_job_service(
            db=db,
            sub_job_id=sub_job_id,
            payload=payload,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================================
# SOFT DELETE SUB JOB
# ==========================================================

@router.delete(
    "/{sub_job_id}"
)
def delete_sub_job(
    sub_job_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return delete_sub_job_service(
            db=db,
            sub_job_id=sub_job_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================================
# PERMANENT DELETE SUB JOB
# ==========================================================

@router.delete(
    "/{sub_job_id}/permanent"
)
def permanently_delete_sub_job(
    sub_job_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:
        return permanently_delete_sub_job_service(
            db=db,
            sub_job_id=sub_job_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )