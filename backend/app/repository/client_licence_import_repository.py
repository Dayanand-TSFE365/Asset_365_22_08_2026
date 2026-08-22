from app.models.client_license_model import ClientLicense,LicenseType
from app.models.master_model import Suppliers
from app.models.import_file_model import ImportFile
from app.models.import_error_model import ImportFileError
from sqlalchemy import func


def get_license_type_by_name(
    db,
    name
):
    return (
        db.query(LicenseType)
        .filter(
            func.upper(
                LicenseType.name
            ) == name.upper()
        )
        .first()
    )




def get_supplier_by_name(
    db,
    name
):
    return (
        db.query(Suppliers)
        .filter(
            Suppliers.name == name
        )
        .first()
    )

def get_license_by_product_key(
    db,
    product_key
):
    return (
        db.query(ClientLicense)
        .filter(
            ClientLicense.product_key == product_key,
            ClientLicense.is_deleted == False
        )
        .first()
    )


def create_license(
    db,
    data
):
    license = ClientLicense(
        **data
    )

    db.add(license)
    db.flush()

    return license






def create_import_file(
    db,
    file_name,
    module_name,
    total_rows,
    uploaded_by=None
):
    import_file = ImportFile(
        file_name=file_name,
        module_name=module_name,
        total_rows=total_rows,
        success_rows=0,
        failed_rows=0,
        uploaded_by=uploaded_by,
        status="IN_PROGRESS"
    )

    db.add(import_file)
    db.flush()

    return import_file


def create_import_error(
    db,
    import_id,
    row_number,
    reference_value,
    error_message
):
    error = ImportFileError(
        import_id=import_id,
        row_number=row_number,
        reference_value=reference_value,
        error_message=error_message
    )

    db.add(error)
    db.flush()

    return error


def update_import_summary(
    db,
    import_file,
    success_rows,
    failed_rows
):
    import_file.success_rows = success_rows
    import_file.failed_rows = failed_rows

    if failed_rows > 0:
        import_file.status = "COMPLETED_WITH_ERRORS"
    else:
        import_file.status = "COMPLETED"

    db.flush()

    return import_file


def get_all_imports(db):
    return (
        db.query(ImportFile)
        .order_by(
            ImportFile.id.desc()
        )
        .all()
    )


def get_import_errors_by_import_id(
    db,
    import_id
):
    return (
        db.query(ImportFileError)
        .filter(
            ImportFileError.import_id == import_id
        )
        .order_by(
            ImportFileError.row_number.asc()
        )
        .all()
    )