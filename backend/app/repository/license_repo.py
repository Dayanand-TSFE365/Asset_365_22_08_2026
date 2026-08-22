from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.license_model import License
from app.models.license_log_model import LicenseLog
from app.models.auth_model import AuthUser 

def create_license(
    db: Session,
    license_data: dict
):
    new_license = License(**license_data)
    db.add(new_license)
    db.flush()

    return new_license



def get_all_licenses(db: Session):
    return  db.query(License).filter(License.is_deleted == False).all()





def checkout_license(db, license_id, data, created_by):

    license = db.query(License).filter(
        License.license_id == license_id
    ).first()

    if not license:
        raise HTTPException(status_code=404, detail="License not found")

    if license.available <= 0:
        raise HTTPException(status_code=400, detail="No seats available")

    # 🔹 optional user lookup (only if user_id provided)
    user = None
    if data.user_id:
        user = db.query(AuthUser).filter(
            AuthUser.id == data.user_id
        ).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    #  MAIN CHANGE → use manual licensed_to
    if not data.licensed_to:
        raise HTTPException(status_code=400, detail="licensed_to is required")

    license.licensed_to = data.licensed_to

    # optional email (if user exists → override)
    license.licensed_to_email = (
    user.email if user else None
    )
  

    # update quantity
    license.available -= 1

    # ✅ log
    log = LicenseLog(
        license_id=license_id,
        user_id=data.user_id,
        action="checkout",
        note=data.checkout_note,
        created_by=created_by
    )

    db.add(log)
    db.flush()

    return log


def checkin_license(db, license_id, data,performed_by):

    license = db.query(License).filter(
        License.license_id == license_id
    ).first()

    if not license:
        raise HTTPException(status_code=404, detail="License not found")

    # CLEAR LICENSE (UI)
    license.licensed_to = None
    license.licensed_to_email = None

    if license.available < license.total:
        license.available += 1

    #  INSERT LOG
    log = LicenseLog(
        license_id=license_id,
        user_id=data.user_id,
        action="checkin",
        note=data.checkin_note,
        created_by=performed_by
    )

    db.add(log)
    db.flush()

    return log

def update_license(db, license_id, update_data: dict):

    license = db.query(License).filter(
        License.license_id == license_id
    ).first()

    if not license:
        return None

    #  Handle total & available carefully
    if "total" in update_data and update_data["total"] is not None:
        new_total = update_data["total"]

        used = license.total - license.available
        license.total = new_total

        # adjust available
        license.available = max(new_total - used, 0)

    # Update other fields
    for key, value in update_data.items():
        if key != "total" and value is not None:
            setattr(license, key, value)

    license.updated_at = datetime.utcnow()

    db.flush()

    return license





def soft_delete_license(db, license_id: int):

    license = db.query(License).filter(
        License.license_id == license_id,
        License.is_deleted == False
    ).first()

    if not license:
        raise HTTPException(status_code=404, detail="License not found")

    license.is_deleted = True
    license.updated_at = datetime.utcnow()

    db.flush()

    return {"message": "License deleted successfully"}



def get_deleted_licenses(db):
    return db.query(License).filter(License.is_deleted == True).all()