from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.services.activity_log_service import (
    get_activity_report_service
)

router = APIRouter(
    prefix="/apiV3/reports",
    tags=["Reports"]
)


@router.get("/activity")
def get_activity_report(
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_asset_db)
):

    return get_activity_report_service(
        db,
        page,
        page_size
        )