from fastapi import Depends, HTTPException

from app.core.dependencies import get_current_user


def require_admin(
    current_user=Depends(get_current_user)
):

    if current_user.role not in [
        "superadmin"
    ]:

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return current_user