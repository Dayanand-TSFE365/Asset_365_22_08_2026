from app.models.client_license_model import ClientLicense
from app.models.client_license_model import LicenseType

def create_client_license_repo(
db,
payload
):
    obj = ClientLicense(
    **payload.dict()
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj



def get_licenses_repo(db):
    return (
        db.query(ClientLicense)
        .filter(
            ClientLicense.is_deleted == False
        )
        .order_by(
            ClientLicense.license_id.desc()
        )
        .all()
    )



def get_license_types_repo(db):
    return (
        db.query(LicenseType)
        .order_by(LicenseType.name.asc())
        .all()
    )

def get_license_by_id_repo(
    db,
    license_id: int
):
    return (
        db.query(ClientLicense)
        .filter(
            ClientLicense.license_id == license_id,
            ClientLicense.is_deleted == False
        )
        .first()
    )



def save_license_repo(
    db,
    license
):
    db.commit()
    db.refresh(license)
    return license


def soft_delete_license_repo(
    db,
    license
):
    license.is_deleted = True
    db.commit()
    db.refresh(license)

    return license

def bulk_delete_license_repo(
    db,
    ids: list[int]
):
    licenses = (
        db.query(ClientLicense)
        .filter(
            ClientLicense.license_id.in_(ids),
            ClientLicense.is_deleted == False
        )
        .all()
    )

    for license in licenses:
        license.is_deleted = True

    db.commit()

    return len(licenses)


def get_deleted_licenses_repo(db):
    return (
        db.query(ClientLicense)
        .filter(
            ClientLicense.is_deleted == True
        )
        .order_by(
            ClientLicense.license_id.desc()
        )
        .all()
    )

def get_deleted_license_by_id_repo(
    db,
    license_id: int
):
    return (
        db.query(ClientLicense)
        .filter(
            ClientLicense.license_id == license_id,
            ClientLicense.is_deleted == True
        )
        .first()
    )


def restore_license_repo(
    db,
    license
):
    license.is_deleted = False

    db.commit()
    db.refresh(license)

    return license

def permanently_delete_license_repo(
    db,
    license
):
    db.delete(license)
    db.commit()