import os
from datetime import datetime
from app.models.asset_audit_model import AssetAudit
from fastapi import HTTPException
from app.models.asset_model import Asset
from app.services.activity_log_service import log_activity
from app.repository import asset_repo



UPLOAD_DIR = "uploads/assets_audit_images"

os.makedirs(UPLOAD_DIR, exist_ok=True)


async def audit_asset(db, asset_id, location_id, update_location, next_audit_date, notes, file, user_id):

    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Save image
    image_path = None
    if file:
        file_path = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        image_path = file_path

    # Save audit
    audit = AssetAudit(
        asset_id=asset_id,
        audited_by=user_id,
        audit_date=datetime.utcnow(),
        status="verified",
        remarks=notes,
        next_audit_date=next_audit_date,
        # add this column in DB/model
        image_url=image_path
    )

    asset_repo.create_asset_audit(db,audit)

    #  Update asset
    if update_location:
        asset.location_id = location_id

    if next_audit_date:
        asset.next_audit_date = next_audit_date

    asset.updated_at = datetime.utcnow()

    # ACTIVITY LOG
    log_activity(
        db=db,
        created_by=user_id,
        module="ASSET",
        action="AUDIT",
        item_type="ASSET",
        item_id=asset.asset_id,
        item_name=asset.asset_name,
        notes=notes or "Asset audited"
    )

    db.commit()
    db.refresh(asset)

    return asset







def get_asset_audit_history_service(
    db,
    asset_id
):

    asset = db.query(Asset).filter(
        Asset.asset_id == asset_id
    ).first()

    if not asset:

        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    return asset_repo.get_asset_audits_repo(
        db,
        asset_id
    )

def get_all_asset_audits_service(db):

    return asset_repo.get_all_asset_audits_repo(db)