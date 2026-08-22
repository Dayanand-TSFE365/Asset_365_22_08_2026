from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repository.asset_request_repo import (
    create_asset_request,
    get_all_asset_requests,
    get_asset_request_by_id,
    get_requests_by_user,
    update_asset_request_status,
    delete_asset_request
)
from app.schemas.asset_request_schema import (
    AssetRequestUpdate
)

from app.repository.asset_request_repo import (
    update_asset_request,
    checkout_asset_request
)

from app.models.asset_model import Asset


#  CREATE REQUEST
def create_asset_request_service(db: Session, data):

    #  CHECK ASSET EXISTS
    asset = (
        db.query(Asset)
        .filter(
            Asset.asset_id == data.asset_id,
            Asset.is_deleted == False
        )
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    #  CHECK REQUESTABLE
    if not asset.requestable:
        raise HTTPException(
            status_code=400,
            detail="Asset is not requestable"
        )

    #  CREATE REQUEST
    return create_asset_request(db, data)

def get_requestable_assets_service(db: Session):

    return (
        db.query(Asset)
        .filter(
            Asset.checked_out_to==None,
            Asset.requestable == True,
            Asset.is_deleted == False
        )
        .all()
    )

#  GET ALL REQUESTS
def get_all_asset_requests_service(db: Session):

    results = get_all_asset_requests(db)

    response = []

    for request, asset_tag, asset_name, image_url in results:

        response.append({

            "request_id": request.request_id,

            "asset_id": request.asset_id,

            "asset_tag": asset_tag,

            "asset_name": asset_name,

            "image_url": image_url,

            "requested_by": request.requested_by,

            "request_date": request.request_date,

            "expected_checkin_date":
                request.expected_checkin_date,

            "status": request.status,

            "notes": request.notes
        })

    return response


#  GET REQUEST BY ID
def get_asset_request_by_id_service(
    db: Session,
    request_id: int
):

    request = get_asset_request_by_id(db, request_id)

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    return request


#  GET REQUESTS BY USER
def get_requests_by_user_service(
    db: Session,
    user_id: int
):

    results = get_requests_by_user(
        db,
        user_id
    )

    response = []

    for (
        request,
        asset_tag,
        asset_name,
        image_url
    ) in results:

        response.append({

            "request_id":
                request.request_id,

            "asset_id":
                request.asset_id,

            "asset_tag":
                asset_tag,

            "asset_name":
                asset_name,

            "image_url":
                image_url,

            "requested_by":
                request.requested_by,

            "request_date":
                request.request_date,

            "expected_checkin_date":
                request.expected_checkin_date,

            "status":
                request.status,

            "approved_by":
                request.approved_by,

            "approved_at":
                request.approved_at,

            "notes":
                request.notes
        })

    return response


#  APPROVE / REJECT REQUEST
def update_asset_request_status_service(
    db: Session,
    request_id: int,
    data
):

    request = get_asset_request_by_id(db, request_id)

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    return update_asset_request_status(
        db=db,
        request=request,
        status=data.status,
        approved_by=data.approved_by
    )


#  DELETE REQUEST
def delete_asset_request_service(
    db: Session,
    request_id: int
):

    request = get_asset_request_by_id(db, request_id)

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    delete_asset_request(db, request)

    return {
        "message": "Request deleted successfully"
    }






#  UPDATE REQUEST
def update_asset_request_service(
    db: Session,
    request_id: int,
    data: AssetRequestUpdate
):

    request = get_asset_request_by_id(
        db,
        request_id
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    #  only pending request editable
    if request.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be updated"
        )

    return update_asset_request(
        db,
        request,
        data
    )


#  CHECKOUT APPROVED REQUEST
def checkout_asset_request_service(
    db: Session,
    request_id: int,
    checked_out_by: int
):

    request = get_asset_request_by_id(
        db,
        request_id
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    # only approved request checkout
    if request.status != "Approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved requests can be checked out"
        )

    asset = (
        db.query(Asset)
        .filter(
            Asset.asset_id == request.asset_id
        )
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    # already assigned
    if asset.checked_out_to:
        raise HTTPException(
            status_code=400,
            detail="Asset already checked out"
        )

    return checkout_asset_request(
        db=db,
        request=request,
        asset=asset,
        checked_out_by=checked_out_by
    )

#  DELETE REQUEST
def delete_asset_request_service(
    db: Session,
    request_id: int
):

    request = get_asset_request_by_id(
        db,
        request_id
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    #  only pending requests deletable
    if request.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be deleted"
        )

    delete_asset_request(
        db,
        request
    )

    return {
        "message": "Request deleted successfully"
    }


#  APPROVE / REJECT REQUEST
def update_asset_request_status_service(
    db: Session,
    request_id: int,
    data
):

    request = get_asset_request_by_id(
        db,
        request_id
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    valid_status = [
        "Approved",
        "Rejected"
    ]

    if data.status not in valid_status:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    if request.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be updated"
        )

    return update_asset_request_status(
        db=db,
        request=request,
        status=data.status,
        approved_by=data.approved_by
    )