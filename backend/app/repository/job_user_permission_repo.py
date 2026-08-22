from app.models.job_user_permission_model import (
    JobUserPermission
)


def create_job_user_permission_repo(
    db,
    permission
):
    db.add(permission)
    return permission


def get_job_permission_repo(
    db,
    job_id: int,
    user_id: int
):
    return (
        db.query(JobUserPermission)
        .filter(
            JobUserPermission.job_id == job_id,
            JobUserPermission.user_id == user_id,
            JobUserPermission.is_deleted == False
        )
        .first()
    )

def get_job_user_permissions_repo(
    db,
    job_id: int
):
    return (
        db.query(JobUserPermission)
        .filter(
            JobUserPermission.job_id == job_id,
            JobUserPermission.is_deleted == False
        )
        .order_by(
            JobUserPermission.permission_id.desc()
        )
        .all()
    )


def get_job_user_permission_by_id_repo(
    db,
    permission_id: int
):
    return (
        db.query(JobUserPermission)
        .filter(
            JobUserPermission.permission_id == permission_id,
            JobUserPermission.is_deleted == False
        )
        .first()
    )


def get_job_user_permission_by_job_and_user_repo(
    db,
    job_id: int,
    user_id: int
):
    return (
        db.query(JobUserPermission)
        .filter(
            JobUserPermission.job_id == job_id,
            JobUserPermission.user_id == user_id,
            JobUserPermission.is_deleted == False
        )
        .first()
    )


def update_job_user_permission_repo(
    permission,
    payload
):
    update_data = payload.dict(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            permission,
            key,
            value
        )

    return permission


def delete_job_user_permission_repo(
    permission
):
    permission.is_deleted = True
    return permission


def check_job_permission_repo(
    db,
    job_id: int,
    user_id: int
):
    return (
        db.query(JobUserPermission)
        .filter(
            JobUserPermission.job_id == job_id,
            JobUserPermission.user_id == user_id,
            JobUserPermission.is_deleted == False
        )
        .first()
    )

def has_job_permission_repo(
    db,
    job_id: int,
    user_id: int
):
    return (
        db.query(JobUserPermission)
        .filter(
            JobUserPermission.job_id == job_id,
            JobUserPermission.user_id == user_id,
            JobUserPermission.can_view == True,
            JobUserPermission.is_deleted == False
        )
        .count() > 0
    )

def has_file_permission_repo(
    db,
    job_id: int,
    user_id: int,
    permission_field: str
):
    permission = (
        db.query(JobUserPermission)
        .filter(
            JobUserPermission.job_id == job_id,
            JobUserPermission.user_id == user_id,
            JobUserPermission.is_deleted == False
        )
        .first()
    )

    if not permission:
        return False

    return getattr(permission, permission_field, False)