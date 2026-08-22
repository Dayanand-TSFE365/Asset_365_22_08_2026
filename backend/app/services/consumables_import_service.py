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
    get_category_by_name,
    get_manufacturer_by_name,

    # 🔹 CONSUMABLE
    get_consumable_by_name_and_model,
    create_consumable,

    # 🔹 IMPORT LOGS
    create_import_file,
    create_import_error,
    update_import_summary
)


def import_consumables_service(db, file,performed_by):

    try:

        # =====================================================
        # 🔹 READ FILE
        # =====================================================

        if file.filename.lower().endswith(".csv"):

            df = pd.read_csv(file.file)

        elif file.filename.lower().endswith(".xlsx"):

            df = pd.read_excel(file.file)

        else:

            raise HTTPException(
                status_code=400,
                detail="Only CSV and XLSX files are allowed"
            )

        # =====================================================
        # 🔹 EMPTY FILE VALIDATION
        # =====================================================

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="Import file is empty"
            )

        # =====================================================
        # 🔹 REQUIRED COLUMNS
        # =====================================================

        required_columns = [

            "name",
            "model_no",
            "company",
            "category",
            "manufacturer",
            "total_qty",
            "remaining_qty",
            "min_qty"
        ]

        # =====================================================
        # 🔹 CHECK MISSING COLUMNS
        # =====================================================

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

        # =====================================================
        # 🔹 CREATE IMPORT HISTORY
        # =====================================================

        import_file = create_import_file(
            db=db,
            file_name=file.filename,
            module_name="consumables",
            total_rows=len(df)
        )

        # =====================================================
        # 🔹 LOOP ROWS
        # =====================================================

        for index, row in df.iterrows():

            errors = []

            # =====================================================
            # 🔹 REQUIRED FIELD VALIDATION
            # =====================================================

            validate_required_field(
                row["name"],
                "Consumable name",
                errors
            )

            validate_required_field(
                row["company"],
                "Company",
                errors
            )

            validate_required_field(
                row["category"],
                "Category",
                errors
            )

            validate_required_field(
                row["manufacturer"],
                "Manufacturer",
                errors
            )

            # =====================================================
            # 🔹 STOP FURTHER VALIDATION
            # =====================================================

            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    asset_tag=str(row.get("name", "")),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # =====================================================
            # 🔹 NUMERIC VALIDATION
            # =====================================================

            total_qty = validate_integer_field(
                row["total_qty"],
                "Total quantity",
                errors
            )

            remaining_qty = validate_integer_field(
                row["remaining_qty"],
                "Remaining quantity",
                errors
            )

            min_qty = validate_integer_field(
                row["min_qty"],
                "Minimum quantity",
                errors
            )

            # =====================================================
            # 🔹 NEGATIVE VALIDATION
            # =====================================================

            validate_non_negative(
                total_qty,
                "Total quantity",
                errors
            )

            validate_non_negative(
                remaining_qty,
                "Remaining quantity",
                errors
            )

            validate_non_negative(
                min_qty,
                "Minimum quantity",
                errors
            )

            # =====================================================
            # 🔹 BUSINESS VALIDATION
            # =====================================================

            validate_available_less_than_total(
                remaining_qty,
                total_qty,
                errors
            )

            # =====================================================
            # 🔹 DUPLICATE CHECK
            # =====================================================

            existing_consumable = get_consumable_by_name_and_model(
                db,
                row["name"],
                row["model_no"]
            )

            if existing_consumable:

                errors.append(
                    "Consumable already exists"
                )

            # =====================================================
            # 🔹 RELATION VALIDATION
            # =====================================================

            company = get_company_by_name(
                db,
                row["company"]
            )

            if not company:
                errors.append("Invalid company")

            category = get_category_by_name(
                db,
                row["category"]
            )

            if not category:
                errors.append("Invalid category")

            manufacturer = get_manufacturer_by_name(
                db,
                row["manufacturer"]
            )

            if not manufacturer:
                errors.append("Invalid manufacturer")

            # =====================================================
            # 🔹 HANDLE FAILED ROW
            # =====================================================

            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    asset_tag=str(row["name"]),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # =====================================================
            # 🔹 AUTO CALCULATIONS
            # =====================================================

            unit_cost = 0

            if "unit_cost" in df.columns:

                try:
                    unit_cost = float(row["unit_cost"])

                except:
                    unit_cost = 0

            total_cost = total_qty * unit_cost

            # =====================================================
            # 🔹 PREPARE CONSUMABLE DATA
            # =====================================================

            consumable_data = {

                "name": str(row["name"]).strip(),

                "model_no": str(row["model_no"]).strip(),

                "company_id": company.company_id,

                "category_id": category.category_id,

                "manufacturer_id": manufacturer.manufacturer_id,

                "total_qty": total_qty,

                "remaining_qty": remaining_qty,

                "min_qty": min_qty,

                "unit_cost": unit_cost,

                "total_cost": total_cost
            }

            # =====================================================
            # 🔹 CREATE CONSUMABLE
            # =====================================================

            create_consumable(
                db,
                consumable_data
            )
            log_activity(
                db=db,
                created_by=performed_by,
                module="CONSUMABLE",
                action="IMPORT",
                item_type="CONSUMABLE",
                item_name=consumable_data["name"],
                quantity=consumable_data["total_qty"],
                notes="Consumable imported from file"
            )


            success_count += 1

        # =====================================================
        # 🔹 UPDATE IMPORT SUMMARY
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
            item_type="CONSUMABLE_IMPORT",
            item_id=import_file.id,
            item_name=file.filename,
            notes=f"Imported {success_count} consumables"
        )


        # =====================================================
        # 🔹 FINAL COMMIT
        # =====================================================

        db.commit()

        return {

            "message": "Consumable import completed",

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