from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse
from typing import List
import os
import shutil

from app.core.config import settings

from app.models.task_attachment_model import TaskAttachment
from app.services.task.notification_helper import (
    notify_user,
    push_notification,
    get_notification_receiver,
)
from app.services.activity_log_service import log_activity

from app.repository.task_repository import (
    get_task_by_id,
    get_attachment,
    create_attachment,
    delete_attachment,
)

UPLOAD_DIR = os.path.join(
    settings.UPLOAD_DIR,
    "tasks"
)

os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_unique_filename(directory: str, filename: str) -> str:
    base_name, extension = os.path.splitext(filename)

    new_filename = filename
    counter = 1

    while os.path.exists(os.path.join(directory, new_filename)):
        new_filename = f"{base_name}_{counter}{extension}"
        counter += 1

    return new_filename


async def upload_task_attachments_service(
    task_db: Session,
    asset_db: Session,
    task_id: int,
    uploaded_by: int,
    files: List[UploadFile],
):
    try:

        task = get_task_by_id(task_db, task_id)

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found."
            )

        task_folder = os.path.join(
            UPLOAD_DIR,
            str(task.id)
        )

        os.makedirs(task_folder, exist_ok=True)

        uploaded_files = []
        notification = None

        for file in files:

            if not file.filename:
                continue

            filename = get_unique_filename(
                task_folder,
                file.filename,
            )

            file_path = os.path.join(
                task_folder,
                filename,
            )

            file.file.seek(0, os.SEEK_END)
            file_size = file.file.tell()
            file.file.seek(0)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            attachment = TaskAttachment(
                task_id=task.id,
                file_name=filename,
                file_path=file_path,
                file_size=file_size,
                uploaded_by=uploaded_by,
            )

            attachment = create_attachment(
                task_db,
                attachment,
            )

            uploaded_files.append(attachment)

        if uploaded_files:

            receiver = get_notification_receiver(
                task,
                uploaded_by,
            )

            if receiver:

                notification = notify_user(
                    db=task_db,
                    task_id=task.id,
                    user_id=receiver,
                    notification_type="attachment",
                    title="New Task Attachment",
                    message=f"{len(uploaded_files)} attachment(s) uploaded to '{task.title}'.",
                    created_by=uploaded_by,
                )

            log_activity(
                db=asset_db,
                created_by=uploaded_by,
                module="TASK",
                action="UPLOAD_ATTACHMENT",
                item_type="TASK_ATTACHMENT",
                item_id=task.id,
                item_name=task.title,
                notes=(
                    f"Uploaded {len(uploaded_files)} attachment(s) "
                    f"to task '{task.title}'."
                ),
                changes={
                    "files": [
                        {
                            "file_name": attachment.file_name,
                            "file_size": attachment.file_size
                        }
                        for attachment in uploaded_files
                    ]
                }
            )

        task_db.commit()
        for attachment in uploaded_files:
            task_db.refresh(attachment)

        if notification:
            await push_notification(notification)

        return uploaded_files

    except HTTPException:
        task_db.rollback()
        raise

    except Exception as e:
        task_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload attachments: {str(e)}"
        )


def delete_task_attachment_service(
    db: Session,
    attachment_id: int,
):
    try:

        attachment = get_attachment(
            db,
            attachment_id,
        )

        if not attachment:
            raise HTTPException(
                status_code=404,
                detail="Attachment not found."
            )

        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)

        delete_attachment(
            db,
            attachment,
        )

        db.commit()

        return {
            "message": "Attachment deleted successfully."
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete attachment: {str(e)}"
        )


def get_task_attachments_service(
    db: Session,
    task_id: int,
):
    try:

        task = get_task_by_id(
            db,
            task_id,
        )

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found."
            )

        return task.attachments

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch attachments: {str(e)}"
        )


