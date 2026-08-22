from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session
from app.models.auth_model import AuthUser
from app.core.dependencies import get_current_user

from app.db.database import get_asset_db

from app.schemas.job_new_schema import (
    CreateJobNewSchema,
    UpdateJobNewSchema,
    JobNewResponseSchema,
    CreateJobNewResponseSchema
)

from app.services.job_new_service import (
    create_job_service,
    get_jobs_service,
    get_job_by_id_service,
    update_job_service,
    delete_job_service,
    get_deleted_jobs_service,
    restore_job_service,
    permanently_delete_job_service
)

router = APIRouter(
    prefix="/apiV3/jobs-new",
    tags=["Jobs New"]
)


@router.post(
    "/",
    response_model=CreateJobNewResponseSchema
)
def create_job(
    payload: CreateJobNewSchema,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):
    try:
        return create_job_service(
            db,
            payload,
            current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/",
    response_model=list[JobNewResponseSchema]
)
def get_jobs(
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):
    try:
        return get_jobs_service(
            db=db,
            current_user=current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/deleted")
def get_deleted_jobs(
    db: Session = Depends(get_asset_db),
    # current_user=Depends(get_current_user)
):
    return get_deleted_jobs_service(
        db=db,
        # current_user=current_user
    )


@router.get(
    "/{job_id}",
    response_model=JobNewResponseSchema
)
def get_job_by_id(
    job_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):
    try:
        return get_job_by_id_service(
            db,
            job_id,
            current_user=current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )




@router.patch("/{job_id}/restore")
def restore_job(
    job_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:

        return restore_job_service(
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


@router.delete("/{job_id}/permanent")
def permanently_delete_job(
    job_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:

        return permanently_delete_job_service(
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
    
@router.put(
    "/{job_id}",
    response_model=JobNewResponseSchema
)
def update_job(
    job_id: int,
    payload: UpdateJobNewSchema,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
    
):
    try:
        return update_job_service(
            db,
            job_id,
            payload,
            current_user=current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.delete(
    "/{job_id}"
)
def delete_job(
    job_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(get_current_user)
):
    try:
        return delete_job_service(
            db,
            job_id,
            current_user=current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )