from app.models.asset_computer_model import AssetComputerDetails
from app.models.master_model import Manufacturers
from app.models.master_model import Suppliers
from app.models.import_file_model import ImportFile
from app.models.import_error_model import ImportFileError
import pandas as pd


def get_computer_asset_by_asset_no(
    db,
    asset_no
):
    return (
        db.query(AssetComputerDetails)
        .filter(
            AssetComputerDetails.asset_no == asset_no,
            AssetComputerDetails.is_deleted == False
        )
        .first()
    )


def get_manufacturer_by_name(
    db,
    name
):
    return (
        db.query(Manufacturers)
        .filter(
            Manufacturers.name == name
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


def create_computer_asset(
    db,
    data
):
    asset = AssetComputerDetails(
        **data
    )

    db.add(asset)
    db.flush()

    return asset






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