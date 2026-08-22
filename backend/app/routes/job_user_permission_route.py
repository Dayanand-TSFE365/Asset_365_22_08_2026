from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from app.core.admin_require import require_admin
from sqlalchemy.orm import Session

from app.db.database import get_asset_db
from app.core.dependencies import get_current_user
from app.schemas.job_user_permission_schema import (
    CreateJobUserPermissionSchema,
    UpdateJobUserPermissionSchema,
    JobUserPermissionResponseSchema
)

from app.services.job_user_permission_service import (
    create_job_user_permission_service,
    get_job_user_permissions_service,
    get_job_user_permission_by_id_service,
    update_job_user_permission_service,
    delete_job_user_permission_service
)

router = APIRouter(
    prefix="/apiV3/job-permissions",
    tags=["Job User Permissions"]
)





@router.post(
    "/",
    response_model=JobUserPermissionResponseSchema
)
def create_job_permission(
    payload: CreateJobUserPermissionSchema,
    db: Session = Depends(get_asset_db),
    current_user=Depends(require_admin)
):
    print(payload.model_dump()) 
    try:
        return create_job_user_permission_service(
            db,
            payload,
            current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/job/{job_id}",
    response_model=list[JobUserPermissionResponseSchema]
)
def get_job_permissions(
    job_id: int,
    db: Session = Depends(get_asset_db)

):
    try:
        return get_job_user_permissions_service(
            db,
            job_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/{permission_id}",
    response_model=JobUserPermissionResponseSchema
)
def get_job_permission_by_id(
    permission_id: int,
    db: Session = Depends(get_asset_db)
):
    try:
        return get_job_user_permission_by_id_service(
            db,
            permission_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.put(
    "/{permission_id}",
    response_model=JobUserPermissionResponseSchema
)
def update_job_permission(
    permission_id: int,
    payload: UpdateJobUserPermissionSchema,
    db: Session = Depends(get_asset_db),
    current_user = Depends(require_admin)
):
    try:
        return update_job_user_permission_service(
            db,
            permission_id,
            payload,
            current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.delete(
    "/{permission_id}"
)
def delete_job_permission(
    permission_id: int,
    db: Session = Depends(get_asset_db),
    current_user = Depends(require_admin)
):
    try:
        return delete_job_user_permission_service(
            db,
            permission_id,
            current_user
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )