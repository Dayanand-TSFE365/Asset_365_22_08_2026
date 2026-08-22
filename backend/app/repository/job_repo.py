from sqlalchemy.orm import Session
from app.models.job_model import Job
from app.models.job_model import JobStatusMaster
from app.models.job_user_permission_model import JobUserPermission

def create_job_repo(
    db: Session,
    payload
):
    job = Job(
        **payload.dict()
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


def get_all_jobs_repo(db):
    return (
        db.query(Job)
        .filter(Job.is_deleted == False)
        .order_by(Job.job_id.desc())
        .all()
    )


def get_user_jobs_query(
    db: Session,
    user_id: int
):
    return (
        db.query(Job)
        .join(
            JobUserPermission,
            Job.job_id == JobUserPermission.job_id
        )
        .filter(
            Job.is_deleted == False,
            JobUserPermission.user_id == user_id,
            JobUserPermission.can_view == True,
            JobUserPermission.is_deleted == False
        )
    )

def get_assigned_jobs_repo(db, user_id):
    return (
        get_user_jobs_query(db, user_id)
        .order_by(Job.job_id.desc())
        .all()
    )




def get_job_by_id_repo(db, user_id, job_id):
    return (
        get_user_jobs_query(db, user_id)
        .filter(Job.job_id == job_id)
        .first()
    )


def get_job_by_no_repo(
    db,
    job_no
):
    return (
        db.query(Job)
        .filter(
            Job.job_no == job_no,
            Job.is_deleted == False
        )
        .first()
    )


def update_job_repo(
    db: Session,
    job: Job,
    payload
):
    update_data = payload.dict(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            job,
            key,
            value
        )

    db.commit()
    db.refresh(job)

    return job


def delete_job_repo(
    db,
    job
):
    job.is_deleted = True

    db.commit()
    db.refresh(job)

    return job


def update_job_document_status_repo(
    db: Session,
    job_id: int,
    field_name: str,
    value: bool
):
    job = (
        db.query(Job)
        .filter(
            Job.job_id == job_id
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


def search_jobs_repo(db, user_id, search):
    return (
        get_user_jobs_query(db, user_id)
        .filter(
            (Job.job_no.ilike(f"%{search}%")) |
            (Job.customer_name.ilike(f"%{search}%")) |
            (Job.panel_description.ilike(f"%{search}%"))
        )
        .all()
    )

def get_jobs_paginated_repo(
    db: Session,
    skip: int = 0,
    limit: int = 20
):
    return (
        db.query(Job)
        .order_by(Job.job_id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def restore_job_repo(
    db,
    job_id
):
    return (
        db.query(Job)
        .filter(
            Job.job_id == job_id
        )
        .first()
    )


def get_job_by_id_any_repo(
    db,
    job_id
):
    return (
        db.query(Job)
        .filter(
            Job.job_id == job_id
        )
        .first()
    )




def get_job_status_repo(db):
    return (
        db.query(JobStatusMaster)
        .filter(
            JobStatusMaster.is_active == True
        )
        .order_by(
            JobStatusMaster.display_order
        )
        .all()
    )