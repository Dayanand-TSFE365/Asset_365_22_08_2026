from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from app.db.database import get_asset_db

from app.services.depreciation_report_service import (
    depreciation_report_service
)

router = APIRouter(prefix="/apiV3/reports/assets", tags=["Depreciation"])

@router.get("/depreciation")
def depreciation_report(
    db: Session = Depends(get_asset_db)
):

    return depreciation_report_service(db)