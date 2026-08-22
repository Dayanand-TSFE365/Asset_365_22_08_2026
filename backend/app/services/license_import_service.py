import pandas as pd

from fastapi import HTTPException

from app.utils.import_validators import (

    validate_required_field,

    validate_integer_field,

    validate_non_negative,

    validate_available_less_than_total
)
from app.services.activity_log_service import log_activity

from app.repository.import_repository import (

    # 🔹 MASTER LOOKUPS
    get_company_by_name,
    get_manufacturer_by_name,
    get_category_by_name,

    # 🔹 LICENSE
    get_license_by_product_key,
    create_license,

    # 🔹 IMPORT LOGS
    create_import_file,
    create_import_error,
    update_import_summary
)


def import_licenses_service(db, file,performed_by):

    try:

        #  READ FILE
        if file.filename.lower().endswith(".csv"):

            df = pd.read_csv(file.file)

        elif file.filename.lower().endswith(".xlsx"):

            df = pd.read_excel(file.file)

        else:

            raise HTTPException(
                status_code=400,
                detail="Only CSV and XLSX files are allowed"
            )

        #  EMPTY FILE VALIDATION
        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="Import file is empty"
            )

        #  REQUIRED COLUMNS
        required_columns = [

            "Software_name",
            "product_key",
            "total",
            "available",
            "company",
            "manufacturer",
            "category"
        ]

        #  CHECK MISSING COLUMNS
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

        #  CREATE IMPORT HISTORY
        import_file = create_import_file(
            db=db,
            file_name=file.filename,
            module_name="licenses",
            total_rows=len(df)
        )

        #  LOOP ROWS
        for index, row in df.iterrows():

            errors = []

            # =====================================================
            # 🔹 REQUIRED FIELD VALIDATION
            # =====================================================

            validate_required_field(
                row["Software_name"],
                "Software name",
                errors
            )

            validate_required_field(
                row["product_key"],
                "Product key",
                errors
            )

            validate_required_field(
                row["company"],
                "Company",
                errors
            )

            validate_required_field(
                row["manufacturer"],
                "Manufacturer",
                errors
            )

            validate_required_field(
                row["category"],
                "Category",
                errors
            )

            # 🔹 STOP FURTHER VALIDATION
            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    reference_value=str(
                        row.get("product_key", "")
                    ),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # =====================================================
            #  NUMERIC VALIDATION
            # =====================================================

            total = validate_integer_field(
                row["total"],
                "Total",
                errors
            )

            available = validate_integer_field(
                row["available"],
                "Available",
                errors
            )

            # =====================================================
            # 🔹 NEGATIVE VALUE VALIDATION
            # =====================================================

            validate_non_negative(
                total,
                "Total",
                errors
            )

            validate_non_negative(
                available,
                "Available",
                errors
            )

            # =====================================================
            # 🔹 BUSINESS VALIDATION
            # =====================================================

            validate_available_less_than_total(
                available,
                total,
                errors
            )

            # =====================================================
            # 🔹 DUPLICATE CHECK
            # =====================================================

            existing_license = get_license_by_product_key(
                db,
                row["product_key"]
            )

            if existing_license:

                errors.append(
                    "Product key already exists"
                )

            # =====================================================
            #  RELATION VALIDATION
            # =====================================================

            company = get_company_by_name(
                db,
                row["company"]
            )

            if not company:
                errors.append("Invalid company")

            manufacturer = get_manufacturer_by_name(
                db,
                row["manufacturer"]
            )

            if not manufacturer:
                errors.append("Invalid manufacturer")

            category = get_category_by_name(
                db,
                row["category"]
            )

            if not category:
                errors.append("Invalid category")

            # =====================================================
            # 🔹 HANDLE FAILED ROW
            # =====================================================

            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    asset_tag=str(row["product_key"]),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # =====================================================
            # 🔹 PREPARE LICENSE DATA
            # =====================================================

            license_data = {

                "Software_name": str(
                    row["Software_name"]
                ).strip(),

                "product_key": str(
                    row["product_key"]
                ).strip(),

                "total": total,

                "available": available,

                "company_id": company.company_id,

                "manufacturer_id": manufacturer.manufacturer_id,

                "category_id": category.category_id
            }

            #  CREATE LICENSE
            create_license(
                db,
                license_data
            )
            log_activity(
                db=db,
                created_by=performed_by,
                module="LICENSE",
                action="IMPORT",
                item_type="LICENSE",
                item_name=license_data["Software_name"],
                quantity=license_data["total"],
                notes="License imported from file"
            )

            success_count += 1

        # =====================================================
        #  UPDATE IMPORT SUMMARY
        # =====================================================

        update_import_summary(
            db=db,
            import_file=import_file,
            success_rows=success_count,
            failed_rows=failed_count
        )
        log_activity(
            db=db,
            created_by=performed_by,
            module="IMPORT",
            action="IMPORT_FILE",
            item_type="LICENSE_IMPORT",
            item_id=import_file.id,
            item_name=file.filename,
            notes=f"Imported {success_count} licenses"
        )

        #  FINAL COMMIT
        db.commit()

        return {

            "message": "License import completed",
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