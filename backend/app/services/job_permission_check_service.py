from fastapi import HTTPException

from app.repository.permission_repository import (
    has_global_permission_repo
)
from app.repository.master_repo import get_user_by_id
from app.repository.job_user_permission_repo import (
    get_job_permission_repo
)





GLOBAL_PERMISSION_MAPPING = {
    # Job permissions
    "can_create": "create_jobs",
    "can_update": "update_jobs",
    "can_delete": "delete_jobs",

    # File permissions
    "can_upload_file": "upload_file_jobs",
    "can_view_file": "view_file_jobs",
    "can_download_file": "download_jobs",
    "can_delete_file": "delete_attachment_jobs",
}


def check_job_permission(
    db,
    job_id: int,
    user_id: int,
    permission_name: str,
    
):
    """
    Permission Flow

    1. Check Global Permission
    2. If not found, check JobUserPermission
    """
    user = get_user_by_id(db, user_id)

    if user and user.role.lower() == "superadmin":
        return True

    # ----------------------------------------
    # STEP 1 : CHECK GLOBAL PERMISSION
    # ----------------------------------------

    global_permission_code = GLOBAL_PERMISSION_MAPPING.get(
        permission_name
    )

    if global_permission_code:

        has_global = has_global_permission_repo(
            db=db,
            user_id=user_id,
            permission_code=global_permission_code
        )

        if has_global:
            return True

    # ----------------------------------------
    # STEP 2 : CHECK JOB SPECIFIC PERMISSION
    # ----------------------------------------

    permission = get_job_permission_repo(
        db,
        job_id,
        user_id
    )

    if not permission:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission for this job."
        )

    if not getattr(permission, permission_name, False):
        raise HTTPException(
            status_code=403,
            detail=f"{permission_name} permission denied."
        )

    return True

def check_view_permission(
    db,
    job_id,
    user_id
):
    user = get_user_by_id(db, user_id)
    
    if user and user.role.lower() == "superadmin":
        return True
    
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_view"
    )


def check_upload_permission(
    db,
    job_id,
    user_id,
    
):
    user = get_user_by_id(db, user_id)
    
    if user and user.role.lower() == "superadmin":
        return True
    
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_upload_file"
    )


def check_view_file_permission(
    db,
    job_id,
    user_id
):
    user = get_user_by_id(db, user_id)
        
    if user and user.role.lower() == "superadmin":
        return True
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_view_file"
    )


def check_download_permission(
    db,
    job_id,
    user_id,
    
):
    user = get_user_by_id(db, user_id)
        
    if user and user.role.lower() == "superadmin":
        return True
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_download_file"
    )


def check_delete_file_permission(
    db,
    job_id,
    user_id
):
    user = get_user_by_id(db, user_id)
        
    if user and user.role.lower() == "superadmin":
        return True
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_delete_file"
    )

def check_create_permission(
    db,
    user_id,
    
):
    user = get_user_by_id(db, user_id)
        
    if user and user.role.lower() == "superadmin":
        return True
    
    has_global = has_global_permission_repo(
        db=db,
        user_id=user_id,
        permission_code="create_jobs"
    )

    if not has_global:
        raise HTTPException(
            status_code=403,
            detail="Create job permission denied."
        )

    return True

def check_update_permission(
    db,
    job_id,
    user_id
):
    user = get_user_by_id(db, user_id)
        
    if user and user.role.lower() == "superadmin":
        return True
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_update"
    )


def check_delete_permission(
    db,
    job_id,
    user_id
):
    user = get_user_by_id(db, user_id)
    if user and user.role.lower() == "superadmin":
        return True
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_delete"
    )