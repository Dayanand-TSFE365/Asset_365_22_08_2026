from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_asset_db


from app.schemas.job_schema import (
    CreateJobSchema,
    UpdateJobSchema,
    JobResponseSchema,
    JobStatusResponseSchema
)

from app.services.job_service import (
    create_job_service,
    get_job_status_service,
    get_jobs_service,
    get_job_by_id_service,
    update_job_service,
    delete_job_service,
    search_jobs_service,
    restore_job_service
    
)

router = APIRouter(
    prefix="/apiV3/jobs",
    tags=["Jobs"]
)


@router.post(
    "/",
    response_model=JobResponseSchema
)
def create_job(
    payload: CreateJobSchema,
    db: Session = Depends(get_asset_db)
):
    try:
        return create_job_service(
            db,
            payload
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    


@router.get(
    "/",
    response_model=list[JobResponseSchema]
)
def get_jobs(
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
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


@router.get(
    "/job-status",
    response_model=list[JobStatusResponseSchema]
)
def get_job_status(
    db: Session = Depends(get_asset_db)
):
    try:
        return get_job_status_service(
            db
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.get(
    "/search",
    response_model=list[JobResponseSchema]
)
def search_jobs(
    search: str = Query(...),
    db: Session = Depends(get_asset_db)
):
    try:
        return search_jobs_service(
            db,
            search
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    


@router.get(
    "/{job_id}",
    response_model=JobResponseSchema
)
def get_job_by_id(
    job_id: int,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    try:
        return get_job_by_id_service(
            db=db,
            job_id=job_id,
            current_user=current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    
@router.put(
    "/{job_id}",
    response_model=JobResponseSchema
)
def update_job(
    job_id: int,
    payload: UpdateJobSchema,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
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
    current_user = Depends(get_current_user)
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
    

@router.put(
    "/restore/{job_id}"
)
def restore_job(
    job_id: int,
    db: Session = Depends(get_asset_db)
):
    try:
        return restore_job_service(
            db,
            job_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    


