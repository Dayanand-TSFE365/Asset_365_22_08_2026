from sqlalchemy.orm import Session

from app.models.job_new_model import JobNew
from app.models.job_sub_job_model import JobSubJob
from app.models.job_file_new_model import JobFileNew


def get_job_for_qr_repo(
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


def get_sub_jobs_for_qr_repo(
    db: Session,
    job_id: int
):
    return (
        db.query(JobSubJob)
        .filter(
            JobSubJob.job_id == job_id,
            JobSubJob.is_deleted == False
        )
        .order_by(
            JobSubJob.sub_job_id.asc()
        )
        .all()
    )


def get_as_build_files_for_sub_job_repo(
    db: Session,
    sub_job_id: int
):
    return (
        db.query(JobFileNew)
        .filter(
            JobFileNew.sub_job_id == sub_job_id,
            JobFileNew.file_type == "AS_BUILD",
            JobFileNew.is_deleted == False
        )
        .order_by(
            JobFileNew.file_id.desc()
        )
        .all()
    )