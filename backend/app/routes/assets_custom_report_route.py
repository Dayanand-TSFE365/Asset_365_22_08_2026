from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user

from app.db.database import get_asset_db
from app.schemas.asset_report_schema import (
    AssetReportRequest
)

from fastapi.responses import FileResponse
from app.services.asset_custom_report_service import (
    generate_asset_report_service
)

router = APIRouter(
    prefix="/apiV3/reports",
    tags=["Reports"]
)


@router.post("/assets/custom")
def custom_asset_report(
    data: AssetReportRequest,
    db: Session = Depends(get_asset_db)
):

    return generate_asset_report_service(
        db,
        data
    )

@router.post("/assets/export")
def export_asset_report(
    data: AssetReportRequest,
    db: Session = Depends(get_asset_db)
):

    file_path = generate_asset_report_service(
        db,
        data,
        export_csv_file=True
    )

    return FileResponse(
        path=file_path,
        filename="asset_report.csv",
        media_type="text/csv"
    )

