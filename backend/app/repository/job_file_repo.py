from sqlalchemy.orm import Session

from app.models.job_file_model import JobFile
from app.models.job_model import Job


def create_job_file_repo(
    db: Session,
    job_file: JobFile
):
    db.add(job_file)
    db.commit()
    db.refresh(job_file)

    return job_file


def get_job_files_repo(
    db: Session,
    job_id: int
):
    return (
        db.query(JobFile)
        .filter(
            JobFile.job_id == job_id,
            JobFile.is_deleted == False
        )
        .order_by(JobFile.file_id.desc())
        .all()
    )


def get_job_file_by_id_repo(
    db: Session,
    file_id: int
):
    return (
        db.query(JobFile)
        .filter(
            JobFile.file_id == file_id,
            JobFile.is_deleted == False
        )
        .first()
    )


def update_job_file_repo(
    db: Session,
    job_file: JobFile
):
    db.commit()
    db.refresh(job_file)

    return job_file


def delete_job_file_repo(
    db: Session,
    job_file: JobFile
):
    job_file.is_deleted = True

    db.commit()
    db.refresh(job_file)

    return job_file


def get_job_repo(
    db: Session,
    job_id: int
):
    return (
        db.query(Job)
        .filter(
            Job.job_id == job_id,
            Job.is_deleted == False
        )
        .first()
    )


def update_document_status_repo(
    db: Session,
    job_id: int,
    field_name: str,
    value: bool
):
    job = (
        db.query(Job)
        .filter(
            Job.job_id == job_id,
            Job.is_deleted == False
        )
        .first()
    )

    if not job:
        return None

    setattr(
        job,
        field_name,
        value
    )

    db.commit()
    db.refresh(job)

    return job


def count_file_type_repo(
    db: Session,
    job_id: int,
    file_type: str
):
    return (
        db.query(JobFile)
        .filter(
            JobFile.job_id == job_id,
            JobFile.file_type == file_type,
            JobFile.is_deleted == False
        )
        .count()
    )