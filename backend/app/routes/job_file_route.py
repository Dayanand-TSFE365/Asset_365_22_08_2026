from app.core.dependencies import get_current_user
from app.repository.job_file_repo import get_job_file_by_id_repo
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException
)
from app.core.job_permission import require_job_permission
from app.models.auth_model import AuthUser

from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_asset_db
from app.schemas.job_schema import (
    MultipleUploadResponseSchema
)

from app.schemas.job_file_schema import (
    JobFileResponseSchema
)


from app.services.job_file_service import (
    upload_job_file_service,
    get_job_files_service,
    get_job_file_by_id_service,
    delete_job_file_service,
    download_job_file_service
)



router = APIRouter(
    prefix="/apiV3/job-files",
    tags=["Job Files"]
)




    
@router.post(
    "/upload/{job_id}",
    response_model=MultipleUploadResponseSchema
)
async def upload_job_files(
    job_id: int,
    file_type: str = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(
        require_job_permission("can_upload_file")
    )
):
    try:
        return upload_job_file_service(
            db=db,
            job_id=job_id,
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
    "/job/{job_id}",
    response_model=list[JobFileResponseSchema]
)
def get_job_files(
    job_id: int,
    db: Session = Depends(get_asset_db),
    current_user: AuthUser = Depends(
        require_job_permission("can_view_file")
    )
):
    try:
        return get_job_files_service(
            db=db,
            job_id=job_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    


    
@router.get(
    "/{file_id}",
    response_model=JobFileResponseSchema
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



@router.get("/download/{file_id}")
def download_job_file(
    file_id: int,
    db: Session = Depends(get_asset_db)
):
    try:
        job_file = download_job_file_service(
            db,
            file_id
        )

        return FileResponse(
            path=job_file.file_path,
            filename=job_file.original_file_name,
            media_type="application/octet-stream"
        )

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.delete("/{file_id}")
def delete_job_file(
    file_id: int,
    db: Session = Depends(get_asset_db)
):
    try:
        return delete_job_file_service(
            db,
            file_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    

