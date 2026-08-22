

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_asset_db
from app.repository.job_user_permission_repo import get_job_permission_repo


def require_job_permission(permission_name: str):

    def checker(
        job_id: int,
        db: Session = Depends(get_asset_db),
        current_user=Depends(get_current_user)
    ):

        # SuperAdmin bypass
        if current_user.role.lower() == "superadmin":
            return current_user

        permission = get_job_permission_repo(
            db,
            job_id,
            current_user.id
        )

        if not permission:
            raise HTTPException(
                status_code=403,
                detail="You don't have access to this job."
            )

        if not getattr(permission, permission_name):
            raise HTTPException(
                status_code=403,
                detail=f"{permission_name} permission denied."
            )

        return current_user

    return checker