from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.job_sub_job_model import JobSubJob


def create_sub_job_repo(db: Session, sub_job: JobSubJob):
    db.add(sub_job)
    db.commit()
    db.refresh(sub_job)
    return sub_job


def get_sub_job_by_id(db: Session, sub_job_id: int):
    return (
        db.query(JobSubJob)
        .filter(
            JobSubJob.sub_job_id == sub_job_id,
            JobSubJob.is_deleted == False
        )
        .first()
    )

def get_existing_sub_job_repo(
    db,
    job_id,
    payload
):
    return (
        db.query(JobSubJob)
        .filter(
            JobSubJob.job_id == job_id,
            JobSubJob.panel_description == payload.panel_description,
            JobSubJob.panel_quantity == payload.panel_quantity,
            JobSubJob.as_build == payload.as_build,
            JobSubJob.soft_copy == payload.soft_copy,
            JobSubJob.hard_copy == payload.hard_copy,
            JobSubJob.factory_test_report == payload.factory_test_report,
            JobSubJob.bom_excel == payload.bom_excel,
            JobSubJob.bom_pdf == payload.bom_pdf,
            JobSubJob.bom_updated_on_erp == payload.bom_updated_on_erp,
            JobSubJob.bom_updated_on_tally == payload.bom_updated_on_tally,
            JobSubJob.photos == payload.photos,
            JobSubJob.backup_file == payload.backup_file,
            JobSubJob.mom_uploaded == payload.mom_uploaded,
            JobSubJob.remarks == payload.remarks
        )
        .first()
    )

def get_sub_jobs_by_job_id(db: Session, job_id: int):
    return (
        db.query(JobSubJob)
        .filter(
            JobSubJob.job_id == job_id,
            JobSubJob.is_deleted == False
        )
        .order_by(JobSubJob.sub_job_sequence)
        .all()
    )


def get_next_sub_job_sequence(db: Session, job_id: int):
    max_sequence = (
        db.query(func.max(JobSubJob.sub_job_sequence))
        .filter(
            JobSubJob.job_id == job_id,
            JobSubJob.is_deleted == False
        )
        .scalar()
    )

    return (max_sequence or 0) + 1


def update_sub_job_repo(
    db,
    sub_job,
    payload
):
    update_data = payload.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            sub_job,
            key,
            value
        )

    db.commit()
    db.refresh(sub_job)

    return sub_job

def delete_sub_job(
    db: Session,
    sub_job: JobSubJob
):
    sub_job.is_deleted = True

    db.add(sub_job)

    return sub_job

def get_deleted_sub_job_by_id_repo(
    db: Session,
    sub_job_id: int
):
    return (
        db.query(JobSubJob)
        .filter(
            JobSubJob.sub_job_id == sub_job_id,
            JobSubJob.is_deleted == True
        )
        .first()
    )

def get_all_deleted_sub_jobs_repo(
    db: Session
):
    return (
        db.query(JobSubJob)
        .filter(
            JobSubJob.is_deleted == True
        )
        .order_by(
            JobSubJob.sub_job_id.desc()
        )
        .all()
    )

def get_deleted_sub_jobs_by_job_id_repo(
    db: Session,
    job_id: int
):
    return (
        db.query(JobSubJob)
        .filter(
            JobSubJob.job_id == job_id,
            JobSubJob.is_deleted == True
        )
        .order_by(
            JobSubJob.sub_job_sequence
        )
        .all()
    )


def restore_sub_job_repo(
    db: Session,
    sub_job: JobSubJob
):
    sub_job.is_deleted = False

    db.add(sub_job)

    return sub_job


def permanently_delete_sub_job_repo(
    db: Session,
    sub_job: JobSubJob
):
    db.delete(sub_job)