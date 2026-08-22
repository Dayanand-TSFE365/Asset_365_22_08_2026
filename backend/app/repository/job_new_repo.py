from sqlalchemy.orm import Session, joinedload

from app.models.job_new_model import JobNew
from app.models.job_user_permission_model import JobUserPermission



def get_user_jobs_query(
    db: Session,
    user_id: int
):
    return (
        db.query(JobNew)
        .join(
            JobUserPermission,
            JobNew.job_id == JobUserPermission.job_id
        )
        .options(
            joinedload(JobNew.sub_jobs)
        )
        .filter(
            JobNew.is_deleted == False,
            JobUserPermission.user_id == user_id,
            JobUserPermission.can_view == True,
            JobUserPermission.is_deleted == False
        )
    )



def create_job_repo(
    db: Session,
    payload
):
    job = JobNew(
        **payload
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job




def get_job_by_job_no_repo(
    db: Session,
    job_no: str
):
    return (
        db.query(JobNew)
        .filter(
            JobNew.job_no == job_no,
            JobNew.is_deleted == False
        )
        .first()
    )


def get_job_by_id_repo(
    db,
    user_id,
    job_id
):
    return (
        get_user_jobs_query(
            db,
            user_id
        )
        .filter(
            JobNew.job_id == job_id
        )
        .first()
    )

def get_job_by_id_any_repo(
    db,
    job_id
):
    return (
        db.query(JobNew)
        .options(
            joinedload(JobNew.sub_jobs)
        )
        .filter(
            JobNew.job_id == job_id,
            JobNew.is_deleted == False
        )
        .first()
    )

def get_all_jobs_repo(db):
    return (
        db.query(JobNew)
        .options(
            joinedload(JobNew.sub_jobs)
        )
        .filter(
            JobNew.is_deleted == False
        )
        .order_by(JobNew.job_id.asc())
        .all()
    )


def get_assigned_jobs_repo(
    db,
    user_id
):
    return (
        get_user_jobs_query(
            db,
            user_id
        )
        .order_by(JobNew.job_id.asc())
        .all()
    )


def update_job_repo(
    db: Session,
    job: JobNew,
    payload
):

    for key, value in payload.items():

        setattr(
            job,
            key,
            value
        )

    db.commit()
    db.refresh(job)

    return job


def delete_job_repo(
    db: Session,
    job: JobNew
):
    job.is_deleted = True

    db.commit()
    db.refresh(job)

    return job


def get_deleted_job_by_id_repo(
    db: Session,
    job_id: int
):
    return (
        db.query(JobNew)
        .options(
            joinedload(JobNew.sub_jobs)
        )
        .filter(
            JobNew.job_id == job_id,
            JobNew.is_deleted == True
        )
        .first()
    )


def get_deleted_jobs_repo(
    db: Session
):
    return (
        db.query(JobNew)
        .options(
            joinedload(JobNew.sub_jobs)
        )
        .filter(
            JobNew.is_deleted == True
        )
        .order_by(
            JobNew.job_id.desc()
        )
        .all()
    )


def restore_job_repo(
    db: Session,
    job: JobNew
):
    job.is_deleted = False

    return job


def permanently_delete_job_repo(
    db: Session,
    job: JobNew
):
    db.delete(job)