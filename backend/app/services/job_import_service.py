import pandas as pd

from app.services.job_file_scanner_services import scan_job_folder
from fastapi import HTTPException

from app.utils.import_validators import (
    validate_required_field
)
from app.models.job_model import JobStatusMaster

from app.repository.job_import_repo import (
    get_job_by_job_no,
    create_job,
    create_import_file,
    create_import_error,
    update_import_summary,
    get_all_imports,
    get_import_errors_by_import_id
)

from app.services.activity_log_service import (
    log_activity
)


def clean_string(value):
    if pd.isna(value):
        return None

    value = str(value).strip()

    if value.lower() == "nan":
        return None

    return value or None



def clean_int(value):
    if pd.isna(value):
        return None

    try:
        return int(value)
    except Exception:
        return None
    
def clean_date(value):
    if pd.isna(value):
        return None

    try:
        return pd.to_datetime(
            value,
            dayfirst=True,
            errors="coerce"
        ).date()
    except Exception:
        return None
    


def import_jobs_service(
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
            "job_no",
            "customer_name",
            "so_no",
            "job_date",
            "panel_description",
            "panel_quantity",
            "tested_by",
            "site_commissioned",
            "mom_by",
            "end_user",
            "job_status",
            "remarks_action"
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

        import_file = create_import_file(
            db=db,
            file_name=file.filename,
            module_name="jobs",
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
                row["job_no"],
                "Job No",
                errors
            )

            validate_required_field(
                    row["customer_name"],
                    "Customer Name",
                    errors
                )

            validate_required_field(
                    row["so_no"],
                    "SO No",
                    errors
                )

            validate_required_field(
                    row["panel_description"],
                    "Panel Description",
                    errors
                )

            validate_required_field(
                    row["panel_quantity"],
                    "Panel Quantity",
                    errors
                )

            validate_required_field(
                    row["tested_by"],
                    "Tested By",
                    errors
                )

            validate_required_field(
                    row["site_commissioned"],
                    "Site Commissioned",
                    errors
                )

            validate_required_field(
                    row["mom_by"],
                    "MOM By",
                    errors
                )

            if errors:

                failed_count += 1

                create_import_error(
                    db=db,
                    import_id=import_file.id,
                    row_number=index + 1,
                    reference_value=str(
                        row.get("job_no", "")
                    ),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue

            # ==========================================
            # DUPLICATE CHECK
            # ==========================================

            existing_job = (
                get_job_by_job_no(
                    db,
                    str(row["job_no"]).strip()
                )
            )

            if existing_job:
                errors.append(
                    "Job number already exists"
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
                        row.get("job_no", "")
                    ),
                    error_message=", ".join(errors)
                )

                errors_list.append({
                    "row": index + 1,
                    "errors": errors
                })

                continue
            
            status_name = clean_string(
                row.get("job_status")
                )

            status = (
                db.query(JobStatusMaster)
                .filter(
                    JobStatusMaster.status_name == status_name,
                    JobStatusMaster.is_active == True
                )
                .first()
            )

            if status_name and not status:
                errors.append(
                    f"Invalid Job Status: {status_name}"
                )
            # ==========================================
            # PREPARE DATA
            # ==========================================

            job_data = {
                    "job_no":
                        clean_string(
                            row.get("job_no")
                        ),

                    "customer_name":
                        clean_string(
                            row.get("customer_name")
                        ),

                    "so_no":
                        clean_string(
                            row.get("so_no")
                        ),

                    "job_date":
                        clean_date(
                            row.get("job_date")
                        ),

                    "panel_description":
                        clean_string(
                            row.get("panel_description")
                        ),

                    "panel_quantity":
                        clean_int(
                            row.get("panel_quantity")
                        ),

                    "tested_by":
                        clean_string(
                            row.get("tested_by")
                        ),

                    "site_commissioned":
                        clean_string(
                            row.get("site_commissioned")
                        ),

                    "mom_by":
                        clean_string(
                            row.get("mom_by")
                        ),

                    "end_user":
                        clean_string(
                            row.get("end_user")
                        ),
                    "job_status_id": (
                        status.status_id
                        if status
                        else None
                    ),

                    "remarks_action": clean_string(
                        row.get("remarks_action")
                        )
                     
                }
            # ==========================================
            # CREATE JOB
            # ==========================================

            job= create_job(
                db,
                job_data
            )

            scan_job_folder(
                db,
                job.job_id,
                job.job_no
            )

            success_count += 1

            log_activity(
                db=db,
                created_by=performed_by,
                module="JOB",
                action="IMPORT",
                item_type="JOB",
                item_name=job_data["job_no"],
                notes="Job imported from file."
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
    return get_all_imports(
        db,
        module_name="jobs"
    )


def get_import_errors_service(
    db,
    import_id
):
    return get_import_errors_by_import_id(
        db,
        import_id
    )