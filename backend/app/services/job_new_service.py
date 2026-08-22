from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.job_sub_job_model import JobSubJob
from app.services.activity_log_service import log_activity

from app.repository.job_new_repo import (
    create_job_repo,
    get_all_jobs_repo,
    get_job_by_id_repo,
    get_job_by_job_no_repo,
    update_job_repo,
    delete_job_repo,
    get_job_by_id_any_repo,
    get_assigned_jobs_repo,
    get_deleted_job_by_id_repo,
    get_deleted_jobs_repo,
    restore_job_repo,
    permanently_delete_job_repo
    
)

from app.repository.job_sub_job_repo import (
    create_sub_job_repo,
    get_next_sub_job_sequence,
    get_existing_sub_job_repo
)
from app.services.job_permission_check_service import (
    check_view_permission,
    check_create_permission,
    check_update_permission,
    check_delete_permission
)
from app.repository.permission_repository import has_global_permission_repo


def create_job_service(
    db: Session,
    payload,
    current_user
):
    check_create_permission(
        db=db,
        user_id=current_user.id
    )

    job = get_job_by_job_no_repo(
        db,
        payload.job_no.strip().upper()
    )

    if not job:

        job_payload = {

            "job_no": payload.job_no.strip().upper(),

            "customer_name": payload.customer_name,

            "site_commissioned": payload.site_commissioned,

            "so_no": payload.so_no,

            "mom_by": payload.mom_by,

            "job_date": payload.job_date,

            "tested_by": payload.tested_by,

            "end_user": payload.end_user,

            "job_status_id": payload.job_status_id,

            "remarks_action": payload.remarks_action

        }

        job = create_job_repo(
            db,
            job_payload
        )


    sequence = get_next_sub_job_sequence(
        db,
        job.job_id
    )
    existing_sub_job = get_existing_sub_job_repo(
        db=db,
        job_id=job.job_id,
        payload=payload
    )

    if existing_sub_job:
        return {
            "message": "Duplicate sub-job ignored.",
            "job_id": job.job_id,
            "job_no": job.job_no,
            "sub_job_id": existing_sub_job.sub_job_id,
            "sub_job_no": existing_sub_job.sub_job_no
        }

    sub_job = JobSubJob(

        job_id=job.job_id,

        sub_job_sequence=sequence,

        sub_job_no=f"{job.job_no}-{sequence:02d}",

        panel_description=payload.panel_description,

        panel_quantity=payload.panel_quantity,

        as_build=payload.as_build,

        soft_copy=payload.soft_copy,

        hard_copy=payload.hard_copy,

        factory_test_report=payload.factory_test_report,

        bom_excel=payload.bom_excel,

        bom_pdf=payload.bom_pdf,

        bom_updated_on_erp=payload.bom_updated_on_erp,

        bom_updated_on_tally=payload.bom_updated_on_tally,

        photos=payload.photos,

        backup_file=payload.backup_file,

        mom_uploaded=payload.mom_uploaded,

        remarks=payload.remarks

    )

    create_sub_job_repo(
        db,
        sub_job
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="CREATE",
        item_type="JOB",
        item_id=job.job_id,
        item_name=job.job_no,
        notes=(
            f"Created Job '{job.job_no}' "
            f"with Sub Job '{sub_job.sub_job_no}' "
            f"for panel '{sub_job.panel_description}'."
        ),
        changes={
            "sub_job_no": sub_job.sub_job_no,
            "panel_description": sub_job.panel_description,
            "panel_quantity": sub_job.panel_quantity
        }
    )

    return {
        "message": "Job created successfully.",
        "job_id": job.job_id,
        "job_no": job.job_no,
        "sub_job_id": sub_job.sub_job_id,
        "sub_job_no": sub_job.sub_job_no
    }



def get_jobs_service(
    db,
    current_user
):

    

    if current_user.role.lower() == "superadmin":
        return get_all_jobs_repo(db)

    # NEW
    if has_global_permission_repo(
        db,
        current_user.id,
        "view_all_jobs"
    ):
        return get_all_jobs_repo(db)

    print(current_user.id)

    print(
        has_global_permission_repo(
            db,
            current_user.id,
            "view_all_jobs"
        )
    )

    # fallback
    return get_assigned_jobs_repo(
        db=db,
        user_id=current_user.id
    )


def get_deleted_jobs_service(
    db,
    # current_user
):
    # if current_user.role.lower() != "superadmin":

    #     if not has_global_permission_repo(
    #         db,
    #         current_user.id,
    #         "view_all_jobs"
    #     ):
    #         raise HTTPException(
    #             status_code=403,
    #             detail="You don't have permission to view deleted jobs."
    #         )

    return get_deleted_jobs_repo(db)


def get_job_by_id_service(
    db,
    job_id,
    current_user
):

    if current_user.role.lower() == "superadmin":
        job = get_job_by_id_any_repo(
            db,
            job_id
        )

    elif has_global_permission_repo(
        db,
        current_user.id,
        "view_all_jobs"
    ):
        job = get_job_by_id_any_repo(
            db,
            job_id
        )

    else:
        job = get_job_by_id_repo(
            db,
            current_user.id,
            job_id
        )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    return job


def update_job_service(
    db: Session,
    job_id: int,
    payload,
    current_user
): 
    check_update_permission(
        db=db,
        job_id=job_id,
        user_id=current_user.id
    
    )

    job = get_job_by_id_any_repo(
        db,
        job_id
    )

    if not job:
        raise Exception(
            "Job not found."
        )

    if payload.job_no:

        existing = get_job_by_job_no_repo(
            db,
            payload.job_no.strip().upper()
        )

        if (
            existing
            and existing.job_id != job_id
        ):
            raise Exception(
                f"Job No '{payload.job_no}' already exists."
            )

        payload.job_no = payload.job_no.strip().upper()

    changes = payload.model_dump(
        exclude_unset=True
    )

    changed_fields = []

    for field, new_value in changes.items():
        old_value = getattr(job, field)

        if old_value != new_value:
            changed_fields.append(
                f"{field}: '{old_value}' → '{new_value}'"
            )

    job = update_job_repo(
        db,
        job,
        changes
    )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="UPDATE",
        item_type="JOB",
        item_id=job.job_id,
        item_name=job.job_no,
        notes=(
            f"Updated Job '{job.job_no}'. "
            + (
                f"Changes: {', '.join(changed_fields)}."
                if changed_fields
                else "No field values changed."
            )
        )
    )

    return job

def delete_job_service(
    db: Session,
    job_id: int,
    current_user
):
    check_delete_permission(
        db=db,
        job_id=job_id,
        user_id=current_user.id
    )


    job = get_job_by_id_any_repo(
        db,
        job_id
    )

    if not job:
        raise Exception(
            "Job not found."
        )


    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="DELETE",
        item_type="JOB",
        item_id=job.job_id,
        item_name=job.job_no,
        notes=(
            f"Deleted Job '{job.job_no}' "
            f"for customer '{job.customer_name}' "
            f"(SO: {job.so_no})."
        )
        )
    delete_job_repo(
        db,
        job
    )

    return {
        "message": "Job deleted successfully."
    }



def restore_job_service(
    db: Session,
    job_id: int,
    current_user
):
    # --------------------------------
    # SUPERADMIN CHECK
    # --------------------------------

    if current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Only SuperAdmin can restore jobs."
        )

    # --------------------------------
    # GET DELETED JOB
    # --------------------------------

    job = get_deleted_job_by_id_repo(
        db,
        job_id
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Deleted job not found."
        )

    # --------------------------------
    # RESTORE
    # --------------------------------

    job = restore_job_repo(
        db,
        job
    )

    # --------------------------------
    # ACTIVITY LOG
    # --------------------------------

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="RESTORE",
        item_type="JOB",
        item_id=job.job_id,
        item_name=job.job_no,
        notes=(
            f"Restored Job '{job.job_no}' "
            f"for customer '{job.customer_name}'."
        )
    )

    db.commit()

    return {
        "message": "Job restored successfully.",
        "job_id": job.job_id,
        "job_no": job.job_no
    }




def permanently_delete_job_service(
    db: Session,
    job_id: int,
    current_user
):
    # --------------------------------
    # SUPERADMIN CHECK
    # --------------------------------

    if current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Only SuperAdmin can permanently delete jobs."
        )

    # --------------------------------
    # GET DELETED JOB
    # --------------------------------

    job = get_deleted_job_by_id_repo(
        db,
        job_id
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Deleted job not found."
        )

    # Save values before permanent deletion
    job_no = job.job_no
    customer_name = job.customer_name
    deleted_job_id = job.job_id

    # --------------------------------
    # ACTIVITY LOG
    # --------------------------------

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB",
        action="PERMANENT_DELETE",
        item_type="JOB",
        item_id=deleted_job_id,
        item_name=job_no,
        notes=(
            f"Permanently deleted Job '{job_no}' "
            f"for customer '{customer_name}'."
        )
    )

    # --------------------------------
    # PERMANENT DELETE
    # --------------------------------

    permanently_delete_job_repo(
        db,
        job
    )

    db.commit()

    return {
        "message": "Job permanently deleted successfully."
    }



