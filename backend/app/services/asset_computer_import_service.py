import pandas as pd

from fastapi import HTTPException

from app.utils.import_validators import (
validate_required_field
)

from app.repository.asset_computer_import_repository import (
create_import_file,
create_import_error,
update_import_summary,
get_all_imports,
get_import_errors_by_import_id
)
from app.utils.assset_credential_crypto import (
    encrypt_password
)

from app.repository.asset_computer_import_repository import (
    get_computer_asset_by_asset_no,
    get_manufacturer_by_name,
    get_supplier_by_name,
    create_computer_asset
)

from app.services.activity_log_service import (
log_activity
)


import pandas as pd
from decimal import Decimal


def clean_string(value):
    if pd.isna(value):
        return None

    value = str(value).strip()

    if value.lower() == "nan":
        return None

    return value or None


def clean_int(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return int(value)
    except Exception:
        return None


def clean_decimal(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return Decimal(str(value))
    except Exception:
        return None


def clean_date(value):
    if pd.isna(value) or value == "":
        return None

    try:
        return pd.to_datetime(
            value,
            dayfirst=True,
            errors="coerce"
        ).date()
    except Exception:
        return None

def import_computer_assets_service(
db,
file,
performed_by
):
    try:
        # ==========================================
        # READ FILE
        # ==========================================

        if file.filename.lower().endswith(".csv"):
            df = pd.read_csv(file.file)

        elif file.filename.lower().endswith(".xlsx"):
            df = pd.read_excel(file.file)

        else:
            raise HTTPException(
                status_code=400,
                detail="Only CSV and XLSX files are allowed"
            )

        # ==========================================
        # EMPTY FILE VALIDATION
        # ==========================================

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="Import file is empty"
            )

        # ==========================================
        # REQUIRED COLUMNS
        # ==========================================

        required_columns = [
            "asset_type",
            "asset_no",
            "pc_name",
            "manufacturer",
            "supplier"
        ]

        missing_columns = [
            col for col in required_columns
            if col not in df.columns
        ]

        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing columns: {', '.join(missing_columns)}"
            )

        success_count = 0
        failed_count = 0
        errors_list = []

        # ==========================================
        # CREATE IMPORT HISTORY
        # ==========================================

        # import_file = create_import_file(
        #     db=db,
        #     file_name=file.filename,
        #     module_name="computer_assets",
        #     total_rows=len(df)
        # )
        import_file = create_import_file(
            db=db,
            file_name=file.filename,
            module_name="computer_assets",
            total_rows=len(df),
            uploaded_by=performed_by
        )

        # ==========================================
        # LOOP THROUGH ROWS
        # ==========================================

        for index, row in df.iterrows():

            errors = []

            # ==========================================
            # REQUIRED FIELD VALIDATION
            # ==========================================

            validate_required_field(
                row["asset_type"],
                "Asset Type",
                errors
            )

            validate_required_field(
                row["asset_no"],
                "Asset No",
                errors
            )

            validate_required_field(
                row["pc_name"],
                "PC Name",
                errors
            )

            validate_required_field(
                row["manufacturer"],
                "Manufacturer",
                errors
            )

            validate_required_field(
                row["supplier"],
                "Supplier",
                errors
            )

            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    reference_value=str(
                        row.get("asset_no", "")
                    ),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # ==========================================
            # ASSET TYPE VALIDATION
            # ==========================================

            asset_type = str(
                row["asset_type"]
            ).strip().upper()

            if asset_type not in [
                "CLIENT",
                "COMPANY"
            ]:
                errors.append(
                    "Invalid asset type"
                )

            # ==========================================
            # CLIENT VALIDATION
            # ==========================================

            if asset_type == "CLIENT":

                validate_required_field(
                    row["client_name"],
                    "Client Name",
                    errors
                )

                validate_required_field(
                    row["job_po_no"],
                    "Job PO No",
                    errors
                )

            # ==========================================
            # DUPLICATE CHECK
            # ==========================================

            existing_asset = (
                get_computer_asset_by_asset_no(
                    db,
                    str(row["asset_no"]).strip()
                )
            )

            if existing_asset:
                errors.append(
                    "Asset No already exists"
                )

            # ==========================================
            # MANUFACTURER VALIDATION
            # ==========================================

            manufacturer = (
                get_manufacturer_by_name(
                    db,
                    str(
                        row["manufacturer"]
                    ).strip()
                )
            )

            if not manufacturer:
                errors.append(
                    "Invalid manufacturer"
                )

            # ==========================================
            # SUPPLIER VALIDATION
            # ==========================================

            supplier = (
                get_supplier_by_name(
                    db,
                    str(
                        row["supplier"]
                    ).strip()
                )
            )

            if not supplier:
                errors.append(
                    "Invalid supplier"
                )

            # ==========================================
            # HANDLE FAILED ROW
            # ==========================================

            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    reference_value=str(
                        row.get("asset_no", "")
                    ),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue



            configure_date = clean_date(
                row.get("configure_date")
            )

            raw_configure_date = row.get(
                "configure_date"
            )

            if (
                pd.notna(raw_configure_date)
                and str(raw_configure_date).strip() != ""
                and configure_date is None
            ):
                errors.append(
                    "Invalid Configure Date"
                )


            purchase_date = clean_date(
                row.get("purchase_date")
            )

            raw_purchase_date = row.get(
                "purchase_date"
            )

            if (
                pd.notna(raw_purchase_date)
                and str(raw_purchase_date).strip() != ""
                and purchase_date is None
            ):
                errors.append(
                    "Invalid Purchase Date"
                )

            warranty_expire = clean_date(
                row.get("warranty_expire")
            )

            raw_warranty_expire = row.get(
                "warranty_expire"
            )

            if (
                pd.notna(raw_warranty_expire)
                and str(raw_warranty_expire).strip() != ""
                and warranty_expire is None
            ):
                errors.append(
                    "Invalid Warranty Expire Date"
                )

            purchase_cost = clean_decimal(
                row.get("purchase_cost")
            )

            raw_purchase_cost = row.get(
                "purchase_cost"
            )
            admin_password = clean_string(
            row.get(
            "administrator_password"
            )
            )
            email_password = clean_string(
            row.get(
            "email_password"
            )
            )

            if (
                pd.notna(raw_purchase_cost)
                and str(raw_purchase_cost).strip() != ""
                and purchase_cost is None
            ):
                errors.append(
                    "Invalid Purchase Cost"
                )

            # ==========================================
            # PREPARE DATA
            # ==========================================

            asset_data = {
                "asset_type": asset_type,

                "assigned_to":
                    clean_string(
                        row.get("assigned_to")
                    ),

                "asset_no":
                    clean_string(
                        row.get("asset_no")
                    ),

                "client_name":
                    clean_string(
                        row.get("client_name")
                    ),

                "job_po_no":
                    clean_string(
                        row.get("job_po_no")
                    ),

                "pc_name":
                    clean_string(
                        row.get("pc_name")
                    ),

                "administrator_name":
                    clean_string(
                        row.get("administrator_name")
                    ),

                "administrator_password":
                    encrypt_password(
                        admin_password
                    )
                    if admin_password
                    else None,

                "email_id":
                    clean_string(
                        row.get("email_id")
                    ),

                "email_password":
                    encrypt_password(
                        email_password
                    )
                    if email_password
                    else None,

                "operating_system":
                    clean_string(
                        row.get("operating_system")
                    ),

                "office_version":
                    clean_string(
                        row.get("office_version")
                    ),

                "rockwell_software":
                    clean_string(
                        row.get("rockwell_software")
                    ),

                "other_software":
                    clean_string(
                        row.get("other_software")
                    ),

                "item_description":
                    clean_string(
                        row.get("item_description")
                    ),

                "year_of_mfg":
                    clean_int(
                        row.get("year_of_mfg")
                    ),

                "warranty_expire":
                warranty_expire,


                "manufacturer_id":
                    manufacturer.manufacturer_id,

                "serial_no":
                    clean_string(
                        row.get("serial_no")
                    ),

                "system_configuration":
                    clean_string(
                        row.get("system_configuration")
                    ),

                "supplier_id":
                    supplier.supplier_id,

                "order_number":
                    clean_string(
                        row.get("order_number")
                    ),

                "purchase_order_number":
                    clean_string(
                        row.get("purchase_order_number")
                    ),

                "purchase_date":
                    purchase_date,

                "configure_date":
                    configure_date,

                "purchase_cost":
                purchase_cost
            }

            # ==========================================
            # CREATE COMPUTER ASSET
            # ==========================================

            create_computer_asset(
                db,
                asset_data
            )

            success_count += 1

            log_activity(
                db=db,
                created_by=performed_by,
                module="COMPUTER_ASSET",
                action="IMPORT",
                item_type="COMPUTER_ASSET",
                item_name=file.filename,
                notes=(
                    f"Imported computer assets from '{file.filename}'. "
                    f"Total Rows: {len(df)}, "
                    f"Successful: {success_count}, "
                    f"Failed: {failed_count}."
                )
            )

        # ==========================================
        # UPDATE IMPORT SUMMARY
        # ==========================================

        update_import_summary(
            db=db,
            import_file=import_file,
            success_rows=success_count,
            failed_rows=failed_count
        )

        db.commit()

        return {
            "message": "Import completed",
            "import_id": import_file.id,
            "total_rows": len(df),
            "success_rows": success_count,
            "failed_rows": failed_count,
            "errors": errors_list
        }

    except HTTPException as e:
        db.rollback()
        raise e

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    

def get_import_history_service(db):
    return get_all_imports(db)

def get_import_errors_service(db,import_id):
    return get_import_errors_by_import_id(db,import_id)
