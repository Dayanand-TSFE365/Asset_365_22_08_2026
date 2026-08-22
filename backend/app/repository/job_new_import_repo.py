from app.models.job_new_model import JobNew
from app.models.import_file_model import ImportFile
from app.models.import_error_model import ImportFileError
from sqlalchemy import func
from app.models.job_sub_job_model import JobSubJob

def get_job_by_job_no(
    db,
    job_no
):
    return (
        db.query(JobNew)
        .filter(
            JobNew.job_no == job_no,
            JobNew.is_deleted == False
        )
        .first()
    )


def create_job(
    db,
    data
):
    job = JobNew(
        **data
    )

    db.add(job)
    db.flush()

    return job


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


def get_all_imports(
    db,
    module_name=None
):
    query = db.query(ImportFile)

    if module_name:
        query = query.filter(
            ImportFile.module_name == module_name
        )

    return (
        query
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




def get_next_sub_job_sequence(
    db,
    job_id
):
    max_sequence = (
        db.query(
            func.max(JobSubJob.sub_job_sequence)
        )
        .filter(
            JobSubJob.job_id == job_id,
            JobSubJob.is_deleted == False
        )
        .scalar()
    )

    return (max_sequence or 0) + 1