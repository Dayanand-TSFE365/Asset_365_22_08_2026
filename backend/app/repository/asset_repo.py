from sqlalchemy.orm import Session
from app.models.asset_model import Asset
from app.models.asset_audit_model import AssetAudit

def get_all_assets(db: Session):
    return db.query(Asset).all()

def get_asset_by_id(db: Session, asset_id: int):
    return db.query(Asset).filter(Asset.asset_id == asset_id).first()

def create_asset(db: Session,asset: Asset):
    db.add(asset)
    db.flush()
    return asset




def update_asset(db, asset):
    

    db.flush()

    return asset


def add_log(db, log):

    db.add(log)

    db.flush()

    return log


def create_asset_audit(
    db,
    audit
):

    db.add(audit)

    db.flush()

    return audit






def get_asset_audits_repo(
    db,
    asset_id
):

    return (
        db.query(AssetAudit)

        .filter(
            AssetAudit.asset_id == asset_id
        )

        .order_by(
            AssetAudit.audit_date.desc()
        )

        .all()
    )


def get_all_asset_audits_repo(db):

    return (
        db.query(AssetAudit)

        .order_by(
            AssetAudit.audit_date.desc()
        )

        .all()
    )