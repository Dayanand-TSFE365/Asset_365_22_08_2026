import pandas as pd

from fastapi import HTTPException

from app.utils.import_validators import (
    validate_required_field
)

from app.repository.import_repository import (

    #  MASTER LOOKUPS
    get_model_by_name,
    get_status_by_name,
    get_company_by_name,

    #  ASSET
    get_asset_by_tag,
    create_asset,

    #  IMPORT LOGS
    create_import_file,
    create_import_error,
    update_import_summary,

    #  IMPORT HISTORY
    get_all_imports,
    get_import_errors_by_import_id
)
from app.services.activity_log_service import log_activity

def import_assets_service(db, file,performed_by):

    try:

        # =====================================================
        #  READ FILE
        # ====================================================

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
        #  EMPTY FILE VALIDATION
        # =====================================================

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="Import file is empty"
            )

        # =====================================================
        #  REQUIRED COLUMNS
        # =====================================================

        required_columns = [

            "asset_tag",
            "asset_name",
            "serial_number",
            "model",
            "status",
            "company"
        ]
 
        # =====================================================
        #  CHECK MISSING COLUMNS
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
        #  CREATE IMPORT HISTORY
        # =====================================================

        import_file = create_import_file(
            db=db,
            file_name=file.filename,
            module_name="assets",
            total_rows=len(df)
        )

        # =====================================================
        #  LOOP ROWS
        # =====================================================

        for index, row in df.iterrows():

            errors = []

            # =====================================================
            #  REQUIRED FIELD VALIDATION
            # =====================================================

            validate_required_field(
                row["asset_tag"],
                "Asset tag",
                errors
            )

            validate_required_field(
                row["asset_name"],
                "Asset name",
                errors
            )

            validate_required_field(
                row["model"],
                "Model",
                errors
            )

            validate_required_field(
                row["status"],
                "Status",
                errors
            )

            validate_required_field(
                row["company"],
                "Company",
                errors
            )

            # =====================================================
            #  STOP FURTHER VALIDATION
            # =====================================================

            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    asset_tag=str(row.get("asset_tag", "")),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # =====================================================
            #  DUPLICATE CHECK
            # =====================================================

            existing_asset = get_asset_by_tag(
                db,
                row["asset_tag"]
            )

            if existing_asset:

                errors.append(
                    "Asset tag already exists"
                )

            # =====================================================
            #  RELATION VALIDATION
            # =====================================================

            model = get_model_by_name(
                db,
                row["model"]
            )

            if not model:
                errors.append("Invalid model")

            status = get_status_by_name(
                db,
                row["status"]
            )

            if not status:
                errors.append("Invalid status")

            company = get_company_by_name(
                db,
                row["company"]
            )

            if not company:
                errors.append("Invalid company")

            # =====================================================
            #  HANDLE FAILED ROW
            # =====================================================

            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    reference_value=str(
                        row.get("asset_tag", "")
                    ),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # =====================================================
            #  PREPARE ASSET DATA
            # =====================================================

            asset_data = {

                "asset_tag": str(
                    row["asset_tag"]
                ).strip(),

                "asset_name": str(
                    row["asset_name"]
                ).strip(),

                "serial_number": str(
                    row["serial_number"]
                ).strip(),

                "model_id": model.model_id,

                "status_id": status.status_id,

                "company_id": company.company_id
            }

            # =====================================================
            #  CREATE ASSET
            # =====================================================

            create_asset(
                db,
                asset_data
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
            module="ASSET",
            action="IMPORT",
            item_type="ASSET_IMPORT",
            item_id=import_file.id,
            item_name=file.filename,
            notes=(
                f"Imported asset file '{file.filename}'. "
                f"Total Rows: {len(df)}, "
                f"Successful: {success_count}, "
                f"Failed: {failed_count}."
            )
        )

        # =====================================================
        #  FINAL COMMIT
        # =====================================================

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


# =====================================================
#  GET IMPORT HISTORY
# =====================================================

def get_import_history_service(db):

    return get_all_imports(db)


# =====================================================
#  GET IMPORT ERRORS
# =====================================================

def get_import_errors_service(
    db,
    import_id
):

    return get_import_errors_by_import_id(
        db,
        import_id
    )