from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.services.assigned_items_service import (
    get_my_assigned_items_service
)

router = APIRouter(
    prefix="/apiV3/my-assigned-items",
    tags=["My Assigned Items"]
)


# 🔹 GET MY ASSIGNED ITEMS
@router.get("/")
def get_my_assigned_items(
    user_id: int,
    db: Session = Depends(get_asset_db)
):

    return get_my_assigned_items_service(
        db,
        user_id
    )