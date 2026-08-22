from app.models.client_license_file_model import LicenseFile
from app.models.client_license_model import ClientLicense
from sqlalchemy import func

def get_license_repo(
    db,
    license_id
):
    return (
        db.query(ClientLicense)
        .filter(
            ClientLicense.license_id == license_id,
            ClientLicense.is_deleted == False
        )
        .first()
    )

def get_license_file_status_repo(db):
    rows = (
        db.query(
            LicenseFile.license_id,
            func.count(LicenseFile.file_id).label("file_count")
        )
        .group_by(LicenseFile.license_id)
        .all()
    )

    result = {}

    for row in rows:
        result[row.license_id] = row.file_count

    return result


def create_license_file_repo(
    db,
    license_file
):
    db.add(license_file)
    db.commit()
    db.refresh(license_file)

    return license_file


def get_license_files_repo(
    db,
    license_id
):
    return (
        db.query(LicenseFile)
        .filter(
            LicenseFile.license_id == license_id,
            LicenseFile.is_deleted == False
        )
        .order_by(
            LicenseFile.uploaded_at.desc()
        )
        .all()
    )


def get_license_file_by_id_repo(
    db,
    file_id
):
    return (
        db.query(LicenseFile)
        .filter(
            LicenseFile.file_id == file_id,
            LicenseFile.is_deleted == False
        )
        .first()
    )




def count_license_files_repo(
    db,
    license_id
):
    return (
        db.query(LicenseFile)
        .filter(
            LicenseFile.license_id == license_id,
            LicenseFile.is_deleted == False
        )
        .count()
    )


# Deleted file
def get_deleted_license_file_by_id_repo(
    db,
    file_id
):
    return (
        db.query(LicenseFile)
        .filter(
            LicenseFile.file_id == file_id,
            LicenseFile.is_deleted == True
        )
        .first()
    )

def get_deleted_license_files_repo(
    db
):
    return (
        db.query(LicenseFile)
        .filter(
            LicenseFile.is_deleted == True
        )
        .order_by(
            LicenseFile.uploaded_at.desc()
        )
        .all()
    )


# Soft delete
def delete_license_file_repo(
    db,
    license_file
):
    license_file.is_deleted = True

    db.add(license_file)

    return license_file


# Restore
def restore_license_file_repo(
    db,
    license_file
):
    license_file.is_deleted = False

    db.add(license_file)

    return license_file



# Permanent delete
def permanently_delete_license_file_repo(
    db,
    license_file
):
    db.delete(license_file)



