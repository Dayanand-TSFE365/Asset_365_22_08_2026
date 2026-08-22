from sqlalchemy.orm import Session

from app.models.job_user_permission_model import (
    JobUserPermission
)

from app.repository.job_user_permission_repo import (
    create_job_user_permission_repo,
    get_job_user_permissions_repo,
    get_job_user_permission_by_id_repo,
    get_job_user_permission_by_job_and_user_repo,
    update_job_user_permission_repo,
    delete_job_user_permission_repo,
    check_job_permission_repo,
    get_job_permission_repo,
    has_file_permission_repo
)

from app.services.activity_log_service import log_activity


def create_job_user_permission_service(
    db: Session,
    payload,
    current_user
):
    existing_permission = (
        get_job_user_permission_by_job_and_user_repo(
            db,
            payload.job_id,
            payload.user_id
        )
    )

    if existing_permission:
        log_activity(
            db=db,
            created_by=current_user.id,
            module="JOB_PERMISSION",
            action="DUPLICATE_ASSIGNMENT",
            item_type="JOB_PERMISSION",
            target_user_id=payload.user_id,
            notes=(
                f"Attempted to assign duplicate "
                f"permissions for Job ID "
                f"{payload.job_id}."
            )
        )
        raise Exception(
            "Permission already assigned to this user for this job."
        )

    print(current_user)
    print(type(current_user))
    print(current_user.id)
    print(type(current_user.id))

    permission = JobUserPermission(
    job_id=payload.job_id,
    user_id=payload.user_id,

    can_view=payload.can_view,

    can_upload_file=payload.can_upload_file,
    can_view_file=payload.can_view_file,
    can_download_file=payload.can_download_file,
    can_delete_file=payload.can_delete_file,

    assigned_by=current_user.id
    )
    print(permission.assigned_by)
    print(type(permission.assigned_by))

    permission = create_job_user_permission_repo(
        db,
        permission
    )

    db.commit()
    db.refresh(permission)

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB_PERMISSION",
        action="ASSIGN_PERMISSION",
        item_type="JOB_PERMISSION",
        item_id=permission.permission_id,
        target_user_id=permission.user_id,
        notes=(
            f"Assigned job permissions to User ID "
            f"{permission.user_id} "
            f"for Job ID {permission.job_id}."
        ),
        changes={
            "can_view": permission.can_view,
            "can_upload_file": permission.can_upload_file,
            "can_view_file": permission.can_view_file,
            "can_download_file": permission.can_download_file,
            "can_delete_file": permission.can_delete_file
        }
    )

    return permission


def get_job_user_permissions_service(
    db: Session,
    job_id: int
):
    return get_job_user_permissions_repo(
        db,
        job_id
    )


def get_job_user_permission_by_id_service(
    db: Session,
    permission_id: int
):
    permission = (
        get_job_user_permission_by_id_repo(
            db,
            permission_id
        )
    )

    if not permission:
        raise Exception(
            "Permission not found."
        )

    return permission


def update_job_user_permission_service(
    db: Session,
    permission_id: int,
    payload,
    current_user
):
    permission = (
        get_job_user_permission_by_id_repo(
            db,
            permission_id
        )
    )

    if not permission:
        raise Exception(
            "Permission not found."
        )
    update_data = payload.model_dump(exclude_unset=True)

    changed_fields = []

    for field, new_value in update_data.items():
        old_value = getattr(permission, field)

        if old_value != new_value:
            changed_fields.append(
                f"{field}: '{old_value}' → '{new_value}'"
            )

    permission = update_job_user_permission_repo(
        permission,
        payload
    )

    db.commit()
    db.refresh(permission)
    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB_PERMISSION",
        action="UPDATE_PERMISSION",
        item_type="JOB_PERMISSION",
        item_id=permission.permission_id,
        target_user_id=permission.user_id,
        notes=(
            f"Updated permissions for User ID "
            f"{permission.user_id} "
            f"on Job ID {permission.job_id}. "
            + (
                f"Changes: {', '.join(changed_fields)}."
                if changed_fields
                else "No permission values changed."
            )
        )
    )

    return permission


def delete_job_user_permission_service(
    db: Session,
    permission_id: int,
    current_user
):
    permission = (
        get_job_user_permission_by_id_repo(
            db,
            permission_id
        )
    )

    if not permission:
        raise Exception(
            "Permission not found."
        )

    log_activity(
        db=db,
        created_by=current_user.id,
        module="JOB_PERMISSION",
        action="REMOVE_PERMISSION",
        item_type="JOB_PERMISSION",
        item_id=permission.permission_id,
        target_user_id=permission.user_id,
        notes=(
            f"Removed job permissions "
            f"for User ID {permission.user_id} "
            f"from Job ID {permission.job_id}."
        )
    )

    permission = delete_job_user_permission_repo(
        permission
    )

    db.commit()
    db.refresh(permission)

    return {
        "message": "Permission deleted successfully."
    }


def check_job_permission(
    db: Session,
    job_id: int,
    user_id: int,
    permission_name: str
):
    permission = get_job_permission_repo(
        db,
        job_id,
        user_id
    )

    if not permission:
        raise Exception(
            "You don't have access to this job."
        )

    if not getattr(permission, permission_name, False):
        raise Exception(
            f"{permission_name} permission denied."
        )

    return permission

def check_view_permission(
    db,
    job_id,
    user_id
):
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_view"
    )


def check_upload_permission(
    db,
    job_id,
    user_id
):
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
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_view_file"
    )


def check_download_permission(
    db,
    job_id,
    user_id
):
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
    return check_job_permission(
        db,
        job_id,
        user_id,
        "can_delete_file"
    )