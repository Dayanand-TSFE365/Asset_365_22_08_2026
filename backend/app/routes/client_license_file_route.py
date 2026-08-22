from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_asset_db
from app.core.dependencies import get_current_user

from app.schemas.client_license_file_schema import (
    LicenseFileResponseSchema,
    MultipleLicenseFileUploadResponseSchema
)

from app.services.client_license_file_service import (
    get_license_file_status_service,
    upload_license_file_service,
    get_license_files_service,
    get_license_file_by_id_service,
    download_license_file_service,
    delete_license_file_service,
    get_deleted_license_files_service,
    restore_license_file_service,
    permanently_delete_license_file_service
)


router = APIRouter(
    prefix="/apiV3/license-files",
    tags=["License Files"]
)


# =========================================================
# UPLOAD LICENSE FILES
# =========================================================

@router.post(
    "/upload/{license_id}",
    response_model=MultipleLicenseFileUploadResponseSchema
)
async def upload_license_files(
    license_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:

        return upload_license_file_service(
            db=db,
            license_id=license_id,
            files=files,
            uploaded_by=current_user.id
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# =========================================================
# GET LICENSE FILES
# =========================================================

@router.get(
    "/license/{license_id}",
    response_model=list[LicenseFileResponseSchema]
)
def get_license_files(
    license_id: int,
    db: Session = Depends(get_asset_db)
):
    try:

        return get_license_files_service(
            db,
            license_id
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# =========================================================
# FILE STATUS
# =========================================================

@router.get("/status")
def get_license_file_status(
    db: Session = Depends(get_asset_db)
):
    return get_license_file_status_service(db)


# =========================================================
# GET DELETED FILES
# =========================================================

@router.get(
    "/deleted",
    response_model=list[LicenseFileResponseSchema]
)
def get_deleted_license_files(
    db: Session = Depends(get_asset_db),
    # current_user=Depends(get_current_user)
):
    try:

        return get_deleted_license_files_service(
            db=db,
            # current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# RESTORE DELETED FILE
# =========================================================

@router.patch(
    "/{file_id}/restore"
)
def restore_license_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:

        return restore_license_file_service(
            db=db,
            file_id=file_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# PERMANENT DELETE
# =========================================================

@router.delete(
    "/{file_id}/permanent"
)
def permanently_delete_license_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:

        return permanently_delete_license_file_service(
            db=db,
            file_id=file_id,
            current_user=current_user
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# DOWNLOAD FILE
# =========================================================

@router.get(
    "/download/{file_id}"
)
def download_license_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:

        license_file = download_license_file_service(
            db,
            file_id,
            current_user
        )

        return FileResponse(
            path=license_file.file_path,
            filename=license_file.original_file_name,
            media_type="application/octet-stream"
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# =========================================================
# GET FILE BY ID
# =========================================================

@router.get(
    "/{file_id}",
    response_model=LicenseFileResponseSchema
)
def get_license_file(
    file_id: int,
    db: Session = Depends(get_asset_db)
):
    try:

        return get_license_file_by_id_service(
            db,
            file_id
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


# =========================================================
# SOFT DELETE FILE
# =========================================================

@router.delete(
    "/{file_id}"
)
def delete_license_file(
    file_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):
    try:

        return delete_license_file_service(
            db,
            file_id,
            current_user
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )