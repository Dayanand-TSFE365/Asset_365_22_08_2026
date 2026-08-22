from typing import List

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.db.database import get_task_db,get_asset_db
from app.core.dependencies import get_current_user

from app.schemas.task_progress_schema import (
    TaskProgressAttachmentResponse,
)
from app.websocket.connection_manager import manager
from app.repository.task_repository import get_task_progress_by_id
from app.services.task.progress_attachment_service import (
    upload_progress_attachments_service,
    get_progress_attachments_service,
    delete_progress_attachment_service,
    download_attachment_service
)

router = APIRouter(
    prefix="/apiV3/tasks/progress",
    tags=["Task Progress Attachments"],
)


@router.post(
    "/{progress_id}/attachments",
    response_model=List[TaskProgressAttachmentResponse],
)
async def upload_progress_attachments(
    progress_id: int,
    files: List[UploadFile] = File(...),
    task_db: Session = Depends(get_task_db),
    asset_db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user),
):
    attachments = await upload_progress_attachments_service(
        task_db=task_db,
        asset_db=asset_db,
        progress_id=progress_id,
        files=files,
        uploaded_by=current_user.id,
    )
     # Get progress to know the task id
    progress = get_task_progress_by_id(
        task_db,
        progress_id,
    )

    await manager.send_to_task(
        progress.task_id,
        {
            "type": "attachment_uploaded",
            "task_id": progress.task_id,
            "progress_id": progress.id,
            "count": len(attachments),
        }
    )
    return attachments


@router.get(
    "/{progress_id}/attachments",
    response_model=List[TaskProgressAttachmentResponse],
)
def get_progress_attachments(
    progress_id: int,
    db: Session = Depends(get_task_db),
):
    return get_progress_attachments_service(
        db=db,
        progress_id=progress_id,
    )


@router.delete(
    "/attachments/{attachment_id}",
)
def delete_progress_attachment(
    attachment_id: int,
    db: Session = Depends(get_task_db),
    current_user= Depends(get_current_user)
):
    return delete_progress_attachment_service(
        db=db,
        attachment_id=attachment_id,
        current_user=current_user.id
    )

@router.get(
    "/attachments/{attachment_id}/download",
)
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_task_db),
    current_user=Depends(get_current_user)
):
    print("Download route called:", attachment_id)
    return download_attachment_service(
        db,
        attachment_id,
        current_user=current_user.id
    )