from sqlalchemy.orm import Session

from app.repository.job_repo import (
    create_job_repo,
    get_all_jobs_repo,
    get_assigned_jobs_repo,
    get_job_by_id_repo,
    get_job_by_no_repo,
    update_job_repo,
    delete_job_repo,
    search_jobs_repo,
    get_job_status_repo,
    restore_job_repo,
    get_job_by_id_any_repo
)

def get_accessible_job(
    db: Session,
    current_user,
    job_id: int
):
    if current_user.role.lower() == "superadmin":
        return get_job_by_id_any_repo(
            db,
            job_id
        )

    return get_job_by_id_repo(
        db,
        current_user.id,
        job_id
    )


def create_job_service(
    db: Session,
    payload
):
    existing_job = get_job_by_no_repo(
        db,
        payload.job_no.strip().upper()
    )

    if existing_job:
        raise Exception(
            f"Job No '{payload.job_no}' already exists."
        )
    payload.job_no = payload.job_no.strip().upper()

    return create_job_repo(
        db,
        payload
    )




def get_jobs_service(
    db,
    current_user
):
    if current_user.role.lower() == "superadmin":
        return get_all_jobs_repo(db)

    return get_assigned_jobs_repo(
        db=db,
        user_id=current_user.id
    )




def get_job_by_id_service(
    db: Session,
    job_id: int,
    current_user
):
    job = get_accessible_job(
        db,
        current_user,
        job_id
    )

    if not job:
        raise Exception("Job not found.")

    return job


def search_jobs_service(
    db: Session,
    search: str
):
    
    search = search.strip()
    return search_jobs_repo(
        db,
        search
    )



def update_job_service(
    db: Session,
    job_id: int,
    payload,
    current_user
):
    job = get_accessible_job(
        db,
        current_user,
        job_id
    )

    if not job:
        raise Exception("Job not found.")

    if payload.job_no:
        existing_job = get_job_by_no_repo(
            db,
            payload.job_no.strip().upper()
        )

        if (
            existing_job
            and existing_job.job_id != job_id
        ):
            raise Exception(
                f"Job No '{payload.job_no}' already exists."
            )

        payload.job_no = payload.job_no.strip().upper()

    return update_job_repo(
        db,
        job,
        payload
    )



def delete_job_service(
    db: Session,
    job_id: int,
    current_user
):
    job = get_accessible_job(
        db,
        current_user,
        job_id
    )

    if not job:
        raise Exception("Job not found.")

    delete_job_repo(
        db,
        job
    )

    return {
        "message": "Job deleted successfully."
    }
def restore_job_service(
    db: Session,
    job_id: int
):
    job = get_job_by_id_any_repo(
        db,
        job_id
    )

    if not job:
        raise Exception(
            "Job not found."
        )

    job.is_deleted = False

    db.commit()
    db.refresh(job)

    return job



def get_job_status_service(
    db: Session
):
    return get_job_status_repo(db)