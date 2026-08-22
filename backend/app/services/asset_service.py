from app.repository import asset_repo
import os
from fastapi import HTTPException
from datetime import datetime
from app.models.asset_model import Asset

from datetime import datetime

from app.models.asset_model import Asset
from app.models.asset_log_model import AssetLog
from app.repository import asset_repo
from app.core.dependencies import get_current_user
from app.services.activity_log_service import log_activity
from app.core.config import settings


# UPLOAD_FOLDER = "uploads/assets"
UPLOAD_DIR = os.path.join(
    settings.UPLOAD_DIR,
    "assets"
)


def fetch_assets(db):
    return db.query(Asset).filter(Asset.is_deleted == False).all()

def fetch_deleted_assets(db):
    return db.query(Asset).filter(Asset.is_deleted == True).all()

def fetch_asset_by_id(db, asset_id):
    asset = db.query(Asset).filter(
        Asset.asset_id == asset_id,
        Asset.is_deleted == False
    ).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return asset


async def add_asset_with_image(db, data, file, user_id):

    image_path = None

    #  Save Image
    if file:
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        filename = f"{datetime.utcnow().timestamp()}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as buffer:
            buffer.write(await file.read())

        image_path = filepath

    new_asset = Asset(
        #  Basic
        asset_tag=data.asset_tag,
        asset_name=data.asset_name,
        serial_number=data.serial_number,
        image_url=image_path if image_path else data.image_url,

        #  Relations
        company_id=data.company_id,
        model_id=data.model_id,
        status_id=data.status_id,
        checked_out_to=data.checked_out_to,
        location_id=data.location_id,
        supplier_id=data.supplier_id,

        #  Financial
        purchase_cost=data.purchase_cost,
        current_value=data.current_value,
        depreciation_months=data.depreciation_months,

        #  Dates
        purchase_date=data.purchase_date,
        expected_checkin_date=data.expected_checkin_date,
        next_audit_date=data.next_audit_date,
        warranty_months=data.warranty_months,
        warranty_expires=data.warranty_expires,

        #  Other
        order_number=data.order_number,
        notes=data.notes,
        condition=data.condition,
        
        eol_date=data.eol_date,
        
        requestable=data.requestable,
        byod= data.byod,

        #  Audit
        created_by = user_id
    )

    asset_repo.create_asset(db,new_asset)

    log_activity(
    db=db,
    created_by=user_id,
    module="ASSET",
    action="CREATE",
    item_type="ASSET",
    item_id=new_asset.asset_id,
    item_name=new_asset.asset_name,
    notes="Asset created"
    )

    db.commit()
    db.refresh(new_asset)
    
    return new_asset



def update_asset(db, asset_id, data,user_id):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    #  Update only provided fields
    for key, value in data.dict(exclude_unset=True).items():
        setattr(asset, key, value)

    asset.updated_at = datetime.utcnow()

    log_activity(
        db=db,
        created_by=user_id,
        module="ASSET",
        action="UPDATE",
        item_type="ASSET",
        item_id=asset.asset_id,
        item_name=asset.asset_name,
        notes="Asset updated"
    )

    db.commit()

    db.refresh(asset)

    return asset

def delete_asset(db, asset_id, user_id):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Prevent delete if checked out
    if asset.checked_out_to:
        raise HTTPException(status_code=400, detail="Cannot delete checked-out asset")

    asset.is_deleted = True
    asset.updated_at = datetime.utcnow()

    log_activity(
        db=db,
        created_by=user_id,
        module="ASSET",
        action="DELETE",
        item_type="ASSET",
        item_id=asset.asset_id,
        item_name=asset.asset_name,
        notes="Asset deleted"
    )

    db.commit()

    return {
        "message": "Asset deleted successfully"
    }





CHECKED_OUT = 2   # adjust based on your DB

def checkout_asset(db, asset_id, data,performed_by):
    asset = asset_repo.get_asset_by_id(db, asset_id)

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.checked_out_to:
        raise HTTPException(status_code=400, detail="Asset already checked out")

    #  Update asset
    asset.checked_out_to = data.user_id
    asset.status_id = CHECKED_OUT
    asset.expected_checkin_date = data.expected_checkin_date
    asset.updated_at = datetime.utcnow()

    # Save asset
    asset_repo.update_asset(db, asset)

    # Add log
    log = AssetLog(
        asset_id=asset_id,
        user_id=data.user_id,
        action="checkout",
        action_date=datetime.utcnow()
    )
    asset_repo.add_log(db, log)
    log_activity(
    db=db,
    created_by=performed_by,
    module="ASSET",
    action="CHECKOUT",
    item_type="ASSET",
    item_id=asset.asset_id,
    item_name=asset.asset_name,
    target_user_id=data.user_id,
    quantity=1,
    notes="Asset checked out"
)
    db.commit()

    return asset



AVAILABLE = 1  # adjust based on your DB

def checkin_asset(db, asset_id, data, performed_by):
    asset = asset_repo.get_asset_by_id(db, asset_id)

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.checked_out_to is None:
        raise HTTPException(status_code=400, detail="Asset is already checked in")

    #  IMPORTANT: store user BEFORE clearing
    user_id = asset.checked_out_to

    #  Reset assignment
    asset.checked_out_to = None
    asset.status_id = AVAILABLE

    # Update location
    asset.location_id = data.location_id

    # Save checkin date
    asset.last_checkin_date = datetime.utcnow()

    # Clear expected return
    asset.expected_checkin_date = None

    #  Optional notes
    if data.notes:
        asset.notes = data.notes

    asset.updated_at = datetime.utcnow()

    asset_repo.update_asset(db, asset)

    # Log checkin (use previous user)
    log = AssetLog(
        asset_id=asset_id,
        user_id=user_id,   #  FIXED
        action="checkin",
        action_date=datetime.utcnow()
    )
    asset_repo.add_log(db, log)

    log_activity(
    db=db,
    created_by=performed_by,
    module="ASSET",
    action="CHECKIN",
    item_type="ASSET",
    item_id=asset.asset_id,
    item_name=asset.asset_name,
    target_user_id=user_id,
    quantity=1,
    notes="Asset checked in"
    )

    db.commit()

    return asset