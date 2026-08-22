import pandas as pd

from fastapi import HTTPException

from app.utils.import_validators import (
    validate_required_field
)

from app.models.job_model import (
    JobStatusMaster
)

from app.schemas.job_new_schema import (
    CreateJobNewSchema
)

from app.repository.job_new_import_repo import (
    create_import_file,
    create_import_error,
    update_import_summary,
    get_all_imports,
    get_import_errors_by_import_id
)

from app.services.job_new_service import (
    create_job_service
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
    current_user
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
        # CREATE IMPORT HISTORY
        # ==========================================

        import_file = create_import_file(
            db=db,
            file_name=file.filename,
            module_name="jobs_new",
            total_rows=len(df),
            uploaded_by=current_user.id
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
            # VALIDATE JOB STATUS
            # ==========================================

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

            # PREPARE DATA
            # ==========================================

            job_payload = CreateJobNewSchema(

                # --------------------------
                # Job Information
                # --------------------------

                job_no=clean_string(
                    row.get("job_no")
                ),

                customer_name=clean_string(
                    row.get("customer_name")
                ),

                so_no=clean_string(
                    row.get("so_no")
                ),

                job_date=clean_date(
                    row.get("job_date")
                ),

                tested_by=clean_string(
                    row.get("tested_by")
                ),

                site_commissioned=clean_string(
                    row.get("site_commissioned")
                ),

                mom_by=clean_string(
                    row.get("mom_by")
                ),

                end_user=clean_string(
                    row.get("end_user")
                ),

                job_status_id=(
                    status.status_id
                    if status
                    else None
                ),

                remarks_action=clean_string(
                    row.get("remarks_action")
                ),

                # --------------------------
                # Sub Job Information
                # --------------------------

                panel_description=clean_string(
                    row.get("panel_description")
                ),

                panel_quantity=clean_int(
                    row.get("panel_quantity")
                ),

                as_build=bool(
                    row.get("as_build", False)
                ),

                soft_copy=bool(
                    row.get("soft_copy", False)
                ),

                hard_copy=bool(
                    row.get("hard_copy", False)
                ),

                factory_test_report=bool(
                    row.get("factory_test_report", False)
                ),

                bom_excel=bool(
                    row.get("bom_excel", False)
                ),

                bom_pdf=bool(
                    row.get("bom_pdf", False)
                ),

                bom_updated_on_erp=bool(
                    row.get("bom_updated_on_erp", False)
                ),

                bom_updated_on_tally=bool(
                    row.get("bom_updated_on_tally", False)
                ),

                photos=bool(
                    row.get("photos", False)
                ),

                backup_file=bool(
                    row.get("backup_file", False)
                ),

                mom_uploaded=bool(
                    row.get("mom_uploaded", False)
                ),

                remarks=clean_string(
                    row.get("remarks")
                )
            )

            # ==========================================
            # CREATE JOB
            # ==========================================

            create_job_service(
                db,
                job_payload,
                current_user
            )

            success_count += 1

        

        # ==========================================
        # UPDATE IMPORT SUMMARY
        # ==========================================

        update_import_summary(
            db=db,
            import_file=import_file,
            success_rows=success_count,
            failed_rows=failed_count
        )
        log_activity(
            db=db,
            created_by=current_user.id,
            module="JOB_IMPORT",
            action="IMPORT_FILE",
            item_type="JOB_IMPORT",
            item_id=import_file.id,
            item_name=file.filename,
            quantity=success_count,
            notes=(
                f"Imported {success_count} job(s) "
                f"from '{file.filename}'. "
                f"{failed_count} row(s) failed."
            ),
            changes={
                "file_name": file.filename,
                "total_rows": len(df),
                "success_rows": success_count,
                "failed_rows": failed_count
            }
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