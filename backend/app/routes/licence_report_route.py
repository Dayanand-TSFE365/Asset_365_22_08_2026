from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from app.db.database import get_asset_db

from app.services.license_report_service import (
    license_report_service
)
router = APIRouter(prefix="/apiV3/reports/licenses", tags=["License Report"])
@router.get("/depreciation")
def license_report(
    db: Session = Depends(get_asset_db)
):

    return license_report_service(db)

