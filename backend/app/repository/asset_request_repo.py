from sqlalchemy.orm import Session
from datetime import datetime

from app.models.asset_request_model import AssetRequest
from app.models.asset_model import Asset 


# 🔹 CREATE REQUEST
def create_asset_request(db: Session, data):

    new_request = AssetRequest(
        asset_id=data.asset_id,
        requested_by=data.requested_by,
        expected_checkin_date=data.expected_checkin_date,
        notes=data.notes
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


# 🔹 GET ALL REQUESTS
def get_all_asset_requests(db: Session):

    results = (
        db.query(
            AssetRequest,
            Asset.asset_tag,
            Asset.asset_name,
            Asset.image_url
        )
        .join(
            Asset,
            Asset.asset_id == AssetRequest.asset_id
        )
        .all()
    )

    return results


# 🔹 GET REQUEST BY ID
def get_asset_request_by_id(db: Session, request_id: int):

    return (
        db.query(AssetRequest)
        .filter(AssetRequest.request_id == request_id)
        .first()
    )


# 🔹 GET REQUESTS BY USER
# def get_requests_by_user(db: Session, user_id: int):

#     return (
#         db.query(AssetRequest)
#         .filter(AssetRequest.requested_by == user_id)
#         .all()
#     )



def get_requests_by_user(
    db: Session,
    user_id: int
):

    return (

        db.query(

            AssetRequest,

            Asset.asset_tag,

            Asset.asset_name,

            Asset.image_url

        )

        .join(
            Asset,
            Asset.asset_id ==
            AssetRequest.asset_id
        )

        .filter(
            AssetRequest.requested_by ==
            user_id
        )

        .all()
    )


#  UPDATE REQUEST STATUS
def update_asset_request_status(
    db: Session,
    request,
    status,
    approved_by=None
):

    request.status = status

    if approved_by:
        request.approved_by = approved_by
        request.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(request)

    return request


#  DELETE REQUEST
def delete_asset_request(db: Session, request):

    db.delete(request)
    db.commit()





#  UPDATE REQUEST
def update_asset_request(
    db: Session,
    request,
    data
):

    request.expected_checkin_date = (
        data.expected_checkin_date
    )

    request.notes = data.notes

    db.commit()
    db.refresh(request)

    return request


#  CHECKOUT REQUEST
def checkout_asset_request(
    db: Session,
    request,
    asset,
    checked_out_by
):

    # assign asset to user
    asset.checked_out_to = request.requested_by

    asset.expected_checkin_date = (
        request.expected_checkin_date
    )

    asset.last_checkin_date = None

    # OPTIONAL
    # asset.status_id = checked_out_status

    #  update request status
    request.status = "CheckedOut"

    request.approved_by = checked_out_by

    request.approved_at = datetime.utcnow()

    db.commit()

    db.refresh(asset)
    db.refresh(request)

    return request