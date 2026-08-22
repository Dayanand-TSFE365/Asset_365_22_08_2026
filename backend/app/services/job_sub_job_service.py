from fastapi import HTTPException

from app.repository.job_sub_job_repo import (
    get_sub_job_by_id,
    update_sub_job_repo,
    delete_sub_job,
    get_deleted_sub_job_by_id_repo,
    get_deleted_sub_jobs_by_job_id_repo,
    restore_sub_job_repo,
    permanently_delete_sub_job_repo,
    get_all_deleted_sub_jobs_repo,
)
from app.services.activity_log_service import log_activity


def get_sub_job_by_id_service(
    db,
    sub_job_id: int
):
    sub_job = get_sub_job_by_id(
        db,
        sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Sub Job not found."
        )

    return sub_job


def get_deleted_sub_jobs_service(
    db
):

    return get_all_deleted_sub_jobs_repo(
        db
    )

def update_sub_job_service(
    db,
    sub_job_id: int,
    payload,
    current_user
):
    sub_job = get_sub_job_by_id(
        db,
        sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Sub Job not found."
        )

    update_data = payload.model_dump(
        exclude_unset=True
        )
    changed_fields = []

    for field, new_value in update_data.items():
        old_value = getattr(sub_job, field)

        if old_value != new_value:
            changed_fields.append(
                f"{field}: '{old_value}' → '{new_value}'"
            )

    updated_sub_job = update_sub_job_repo(
        db,
        sub_job,
        payload
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="UPDATE_SUB_JOB",
        item_type="SUB_JOB",
        item_id=updated_sub_job.sub_job_id,
        item_name=updated_sub_job.sub_job_no,
        notes=(
            f"Updated Sub Job "
            f"'{updated_sub_job.sub_job_no}'. "
            + (
                f"Changes: {', '.join(changed_fields)}."
                if changed_fields
                else "No field values changed."
            )
        )
    )

    return updated_sub_job


def delete_sub_job_service(
    db,
    sub_job_id: int,
    current_user
):

    sub_job = get_sub_job_by_id(
        db,
        sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Sub Job not found."
        )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="DELETE_SUB_JOB",
        item_type="SUB_JOB",
        item_id=sub_job.sub_job_id,
        item_name=sub_job.sub_job_no,
        notes=(
            f"Deleted Sub Job "
            f"'{sub_job.sub_job_no}' "
            f"for panel "
            f"'{sub_job.panel_description}'."
        )
    )

    delete_sub_job(
        db,
        sub_job
    )

    db.commit()

    return {
        "message": "Sub Job deleted successfully."
    }

def restore_sub_job_service(
    db,
    sub_job_id: int,
    current_user
):

    sub_job = get_deleted_sub_job_by_id_repo(
        db,
        sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Deleted Sub Job not found."
        )

    restored_sub_job = restore_sub_job_repo(
        db,
        sub_job
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="RESTORE_SUB_JOB",
        item_type="SUB_JOB",
        item_id=restored_sub_job.sub_job_id,
        item_name=restored_sub_job.sub_job_no,
        notes=(
            f"Restored Sub Job "
            f"'{restored_sub_job.sub_job_no}' "
            f"for panel "
            f"'{restored_sub_job.panel_description}'."
        )
    )

    db.commit()

    return {
        "message": "Sub Job restored successfully.",
        "sub_job_id": restored_sub_job.sub_job_id,
        "sub_job_no": restored_sub_job.sub_job_no
    }


def permanently_delete_sub_job_service(
    db,
    sub_job_id: int,
    current_user
):

    sub_job = get_deleted_sub_job_by_id_repo(
        db,
        sub_job_id
    )

    if not sub_job:
        raise HTTPException(
            status_code=404,
            detail="Deleted Sub Job not found."
        )

    sub_job_no = sub_job.sub_job_no
    panel_description = sub_job.panel_description
    deleted_sub_job_id = sub_job.sub_job_id

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="PERMANENT_DELETE_SUB_JOB",
        item_type="SUB_JOB",
        item_id=deleted_sub_job_id,
        item_name=sub_job_no,
        notes=(
            f"Permanently deleted Sub Job "
            f"'{sub_job_no}' "
            f"for panel "
            f"'{panel_description}'."
        )
    )

    permanently_delete_sub_job_repo(
        db,
        sub_job
    )

    db.commit()

    return {
        "message": "Sub Job permanently deleted successfully."
    }