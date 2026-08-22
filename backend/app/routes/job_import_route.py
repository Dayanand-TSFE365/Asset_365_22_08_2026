from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_asset_db
from app.core.dependencies import get_current_user

from app.services.job_import_service import (
    import_jobs_service,
    get_import_history_service,
    get_import_errors_service
)

router = APIRouter(
    prefix="/apiV3/jobs",
    tags=["Job Import"]
)


@router.post("/import")
def import_jobs(
    file: UploadFile = File(...),
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    return import_jobs_service(
        db=db,
        file=file,
        performed_by=current_user.id
    )


@router.get("/import/history")
def get_import_history(
    db: Session = Depends(get_asset_db)
):
    return get_import_history_service(db)


@router.get("/import/errors/{import_id}")
def get_import_errors(
    import_id: int,
    db: Session = Depends(get_asset_db)
):
    return get_import_errors_service(
        db,
        import_id
    )


@router.get("/import/template")
def download_template():

    file_path = "templates/jobs/jobs_template.csv"

    return FileResponse(
        path=file_path,
        filename="jobs_template.csv",
        media_type="text/csv"
    )

