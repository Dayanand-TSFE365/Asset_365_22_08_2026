from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.schemas.asset_request_schema import (
    AssetRequestCreate,
    AssetRequestStatusUpdate
)
from app.schemas.asset_request_schema import (
    AssetRequestUpdate,
    AssetRequestCheckout
)
from app.services.asset_request_service import (
    update_asset_request_service,
    checkout_asset_request_service
)

from app.services.asset_request_service import (
    create_asset_request_service,
    get_all_asset_requests_service,
    get_asset_request_by_id_service,
    get_requests_by_user_service,
    update_asset_request_status_service,
    delete_asset_request_service,
    get_requestable_assets_service
)

router = APIRouter(
    prefix="/apiV3/asset-request",
    tags=["Asset Requests"]
)


# 🔹 CREATE REQUEST
@router.post("/")
def create_request(
    data: AssetRequestCreate,
    db: Session = Depends(get_asset_db)
):

    return create_asset_request_service(db, data)


# 🔹 GET ALL REQUESTS
@router.get("/")
def get_all_requests(
    db: Session = Depends(get_asset_db)
):

    return get_all_asset_requests_service(db)



@router.get("/requestable-assets")
def get_requestable_assets(
    db: Session = Depends(get_asset_db)
):

    return get_requestable_assets_service(db)


# 🔹 GET REQUEST BY ID
@router.get("/{request_id}")
def get_request_by_id(
    request_id: int,
    db: Session = Depends(get_asset_db)
):

    return get_asset_request_by_id_service(
        db,
        request_id
    )


# 🔹 GET REQUESTS BY USER
@router.get("/user/{user_id}")
def get_user_requests(
    user_id: int,
    db: Session = Depends(get_asset_db)
):

    return get_requests_by_user_service(
        db,
        user_id
    )


# 🔹 UPDATE REQUEST STATUS
@router.put("/{request_id}/status")
def update_request_status(
    request_id: int,
    data: AssetRequestStatusUpdate,
    db: Session = Depends(get_asset_db)
):

    return update_asset_request_status_service(
        db,
        request_id,
        data
    )


# 🔹 DELETE REQUEST
@router.delete("/{request_id}")
def delete_request(
    request_id: int,
    db: Session = Depends(get_asset_db)
):

    return delete_asset_request_service(
        db,
        request_id
    )


@router.put("/{request_id}")
def update_request(
    request_id: int,
    data: AssetRequestUpdate,
    db: Session = Depends(get_asset_db)
):

    return update_asset_request_service(
        db,
        request_id,
        data
    )


@router.post("/{request_id}/checkout")
def checkout_request(
    request_id: int,
    data: AssetRequestCheckout,
    db: Session = Depends(get_asset_db)
):

    return checkout_asset_request_service(
        db,
        request_id,
        data.checked_out_by
    )