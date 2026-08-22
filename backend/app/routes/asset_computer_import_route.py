from app.core.dependencies import get_current_user
from fastapi.responses import FileResponse
from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile
)
from sqlalchemy.orm import Session

from app.db.database import get_asset_db


from app.services.asset_computer_import_service import (
    import_computer_assets_service,
    get_import_history_service,
    get_import_errors_service
)

router = APIRouter(
    prefix="/apiV3/computer-assets",
    tags=["Computer Asset Import"]
)


@router.post("/import")
def import_computer_assets(
    file: UploadFile = File(...),
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    return import_computer_assets_service(
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

#  DOWNLOAD ASSET TEMPLATE
@router.get("/computer_assets/template")
def download_asset_template():

    file_path = "templates/assets/assets_computer_template.csv"

    return FileResponse(
        path=file_path,
        filename="assets_template.csv",
        media_type="text/csv"
    ) 
    
    
