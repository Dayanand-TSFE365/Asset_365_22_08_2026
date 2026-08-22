from decimal import Decimal,InvalidOperation 
import pandas as pd
from fastapi import HTTPException
from app.repository.client_licence_import_repository import (
    create_import_file,
    create_import_error,
    update_import_summary,
    get_all_imports,
    get_import_errors_by_import_id,
    get_license_type_by_name,
    get_license_by_product_key,
    create_license,
    get_supplier_by_name,
)

from app.services.activity_log_service import log_activity
from app.utils.import_validators import validate_required_field

def clean_string(value):
    if value is None:
        return None

    if pd.isna(value):
        return None

    value = str(value).strip()

    if value == "":
        return None

    if value.lower() == "nan":
        return None

    return value


def clean_date(value):
    """
    Converts Excel/CSV date values to Python date objects.
    Returns None for empty or invalid values.
    """

    if value is None:
        return None

    if pd.isna(value):
        return None

    try:
        date_value = pd.to_datetime(
            value,
            dayfirst=True,
            errors="coerce"
        )

        if pd.isna(date_value):
            return None

        return date_value.date()

    except Exception:
        return None
    

def clean_decimal(value):
    """
    Converts value to Decimal.
    Returns None for empty or invalid values.
    """

    if value is None:
        return None

    if pd.isna(value):
        return None

    value = str(value).strip()

    if value == "":
        return None

    if value.lower() == "nan":
        return None

    try:
        return Decimal(value)
    except (InvalidOperation, ValueError):
        return None
    

def import_licenses_service(
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
        # EMPTY FILE
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
            "license_type",
            "client_name",
            "product_name",
            "supplier"
        ]

        missing_columns = [
            col
            for col in required_columns
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
        # CREATE IMPORT FILE
        # ==========================================

        import_file = create_import_file(
            db=db,
            file_name=file.filename,
            module_name="licenses",
            total_rows=len(df),
            uploaded_by=performed_by
        )

        # ==========================================
        # LOOP
        # ==========================================

        for index, row in df.iterrows():

            errors = []

            # ==========================================
            # REQUIRED FIELD VALIDATION
            # ==========================================

            validate_required_field(
                row["license_type"],
                "License Type",
                errors
            )

            validate_required_field(
                row["client_name"],
                "Client Name",
                errors
            )

            validate_required_field(
                row["product_name"],
                "Product Name",
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
                    reference_value=clean_string(
                        row.get("product_key")
                    ),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # ==========================================
            # LICENSE TYPE
            # ==========================================

            license_type_name = str(
                row["license_type"]
            ).strip().upper()

            license_type = get_license_type_by_name(
                db,
                license_type_name
            )

            if not license_type:
                errors.append(
                    "Invalid license type"
                )

            # ==========================================
            # ROCKWELL VALIDATION
            # ==========================================

            if license_type_name == "ROCKWELL":

                validate_required_field(
                    row.get("serial_number"),
                    "Serial Number",
                    errors
                )

                validate_required_field(
                    row.get("expired_on"),
                    "Expired On",
                    errors
                )

            # ==========================================
            # EXCEL / SQL VALIDATION
            # ==========================================

            if license_type_name in [
                "MICROSOFT EXCEL",
                "MICROSOFT SQL"
            ]:

                validate_required_field(
                    row.get("email_id"),
                    "Email ID",
                    errors
                )

                validate_required_field(
                    row.get("password"),
                    "Password",
                    errors
                )

            # ==========================================
            # SUPPLIER
            # ==========================================

            supplier = get_supplier_by_name(
                db,
                str(
                    row["supplier"]
                ).strip()
            )

            if not supplier:
                errors.append(
                    "Invalid supplier"
                )

            # ==========================================
            # DUPLICATE PRODUCT KEY
            # ==========================================

            product_key = clean_string(
                row.get("product_key")
            )

            if product_key:

                existing = (
                    get_license_by_product_key(
                        db,
                        product_key
                    )
                )

                if existing:
                    errors.append(
                        "Product key already exists"
                    )

            # ==========================================
            # DATE VALIDATION
            # ==========================================

            expired_on = clean_date(
                row.get("expired_on")
            )

            raw_expired_on = row.get(
                "expired_on"
            )

            if (
                pd.notna(raw_expired_on)
                and str(raw_expired_on).strip() != ""
                and expired_on is None
            ):
   
                errors.append(
                    "Invalid Expired On Date"
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

            # ==========================================
            # PURCHASE COST
            # ==========================================

            purchase_cost = clean_decimal(
                row.get("purchase_cost")
            )

            raw_purchase_cost = row.get(
                "purchase_cost"
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
            # HANDLE FAILED ROW
            # ==========================================

            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    reference_value=product_key,
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # ==========================================
            # PREPARE DATA
            # ==========================================

            license_data = {
                "license_type_id":
                    license_type.license_type_id,

                "job_po_no":
                    clean_string(
                        row.get("job_po_no")
                    ),

                "client_name":
                    clean_string(
                        row.get("client_name")
                    ),

                "product_name":
                    clean_string(
                        row.get("product_name")
                    ),

                "description":
                    clean_string(
                        row.get("description")
                    ),

                "serial_number":
                    clean_string(
                        row.get("serial_number")
                    ),

                "product_key":
                    product_key,

                "email_id":
                    clean_string(
                        row.get("email_id")
                    ),

                "password":
                    clean_string(
                        row.get("password")
                    ),

                "note_1":
                    clean_string(
                        row.get("note_1")
                    ),

                "note_2":
                    clean_string(
                        row.get("note_2")
                    ),

                "remarks":
                    clean_string(
                        row.get("remarks")
                    ),

                "expired_on":
                    expired_on,

                "supplier_id":
                    supplier.supplier_id,

                "order_number":
                    clean_string(
                        row.get("order_number")
                    ),

                "purchase_order_number":
                    clean_string(
                        row.get(
                            "purchase_order_number"
                        )
                    ),

                "purchase_date":
                    purchase_date,

                "purchase_cost":
                    purchase_cost,

                "customer_po":
                clean_string(
                    row["customer_po"]
                ) if "customer_po" in df.columns else None,

                "contract":
                    clean_string(
                        row["contract"]
                    ) if "contract" in df.columns else None,
            }

            # ==========================================
            # CREATE LICENSE
            # ==========================================

            create_license(
                db,
                license_data
            )

            success_count += 1


        # ==========================================
        # UPDATE SUMMARY
        # ==========================================

        update_import_summary(
            db=db,
            import_file=import_file,
            success_rows=success_count,
            failed_rows=failed_count
        )
        log_activity(
            db=db,
            created_by=performed_by,
            module="LICENSE",
            action="IMPORT",
            item_type="LICENSE_IMPORT",
            item_id=import_file.id,
            item_name=file.filename,
            notes=(
                f"Imported license file '{file.filename}'. "
                f"Total Rows: {len(df)}, "
                f"Successful: {success_count}, "
                f"Failed: {failed_count}."
            )
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











