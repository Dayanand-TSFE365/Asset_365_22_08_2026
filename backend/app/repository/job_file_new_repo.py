from sqlalchemy.orm import Session

from app.models.job_file_new_model import JobFileNew
from app.models.job_new_model import JobNew
from app.models.job_sub_job_model import JobSubJob


def create_job_file_repo(
    db: Session,
    job_file: JobFileNew
):
    db.add(job_file)  
    db.commit()
    db.refresh(job_file)

    return job_file


def get_job_files_repo(
    db: Session,
    sub_job_id: int
):
    return (
        db.query(JobFileNew)
        .filter(
            JobFileNew.sub_job_id == sub_job_id,
            JobFileNew.is_deleted == False
        )
        .order_by(JobFileNew.file_id.desc())
        .all()
    )


def get_job_file_by_id_repo(
    db: Session,
    file_id: int
):
    return (
        db.query(JobFileNew)
        .filter(
            JobFileNew.file_id == file_id,
            JobFileNew.is_deleted == False
        )
        .first()
    )


def update_job_file_repo(
    db: Session,
    job_file: JobFileNew
):
    db.commit()
    db.refresh(job_file)

    return job_file


def delete_job_file_repo(
    db: Session,
    job_file: JobFileNew
):
    job_file.is_deleted = True

    db.add(job_file)

    return job_file


def get_job_repo(
    db: Session,
    job_id: int
):
    return (
        db.query(JobNew)
        .filter(
            JobNew.job_id == job_id,
            JobNew.is_deleted == False
        )
        .first()
    )


def get_sub_job_repo(
    db: Session,
    sub_job_id: int
):
    return (
        db.query(JobSubJob)
        .filter(
            JobSubJob.sub_job_id == sub_job_id,
            JobSubJob.is_deleted == False
        )
        .first()
    )


def update_document_status_repo(
    db: Session,
    sub_job_id: int,
    field_name: str,
    value: bool
):
    sub_job = (
        db.query(JobSubJob)
        .filter(
            JobSubJob.sub_job_id == sub_job_id,
            JobSubJob.is_deleted == False
        )
        .first()
    )

    if not sub_job:
        return None

    setattr(
        sub_job,
        field_name,
        value
    )

    db.commit()
    db.refresh(sub_job)

    return sub_job


def count_file_type_repo(
    db: Session,
    sub_job_id: int,
    file_type: str
):
    return (
        db.query(JobFileNew)
        .filter(
            JobFileNew.sub_job_id == sub_job_id,
            JobFileNew.file_type == file_type,
            JobFileNew.is_deleted == False
        )
        .count()
    )


def get_deleted_job_files_repo(
    db: Session,
    sub_job_id: int | None = None
):
    query = (
        db.query(JobFileNew)
        .filter(
            JobFileNew.is_deleted == True
        )
    )

    if sub_job_id is not None:
        query = query.filter(
            JobFileNew.sub_job_id == sub_job_id
        )

    return (
        query
        .order_by(JobFileNew.file_id.desc())
        .all()
    )


def get_deleted_job_file_by_id_repo(
    db: Session,
    file_id: int
):
    return (
        db.query(JobFileNew)
        .filter(
            JobFileNew.file_id == file_id,
            JobFileNew.is_deleted == True
        )
        .first()
    )

def restore_job_file_repo(
    db: Session,
    job_file: JobFileNew
):
    job_file.is_deleted = False

    db.add(job_file)

    return job_file


def permanently_delete_job_file_repo(
    db: Session,
    job_file: JobFileNew
):
    db.delete(job_file)

    return job_file