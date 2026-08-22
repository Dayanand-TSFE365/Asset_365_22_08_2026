import os
import shutil
from typing import List

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from app.services.activity_log_service import log_activity
from app.core.config import settings
from app.models.task_progress_attachment_model import TaskProgressAttachment
from app.services.task.notification_helper import (
    notify_user,
    push_notification,
    get_notification_receiver,
    get_notification_receivers
)

from app.repository.task_repository import (
    get_task_progress_by_id,
    get_progress_attachment_by_id,
    create_progress_attachment,
    get_progress_attachments,
    delete_progress_attachment,
    get_task_by_id,
)


UPLOAD_DIR = os.path.join(
    settings.UPLOAD_DIR,
    "task_progress"
)

os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_unique_filename(directory: str, filename: str):
    base, extension = os.path.splitext(filename)
    counter = 1

    unique_filename = filename

    while os.path.exists(os.path.join(directory, unique_filename)):
        unique_filename = f"{base}_{counter}{extension}"
        counter += 1

    return unique_filename


async def upload_progress_attachments_service(
    task_db: Session,
    asset_db: Session,
    progress_id: int,
    files: List[UploadFile],
    uploaded_by: int,
):
    try:

        progress = get_task_progress_by_id(
            task_db,
            progress_id,
        )

        if not progress:
            raise HTTPException(
                status_code=404,
                detail="Task progress not found."
            )


        progress_folder = os.path.join(
            UPLOAD_DIR,
            str(progress_id),
        )

        os.makedirs(progress_folder, exist_ok=True)

        uploaded_files = []

        for file in files:

            filename = get_unique_filename(
                progress_folder,
                file.filename,
            )

            file_path = os.path.join(
                progress_folder,
                filename,
            )

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            attachment = TaskProgressAttachment(
                task_progress_id=progress_id,
                file_name=filename,
                file_path=file_path,
                file_size=os.path.getsize(file_path),
                uploaded_by=uploaded_by,
            )

            attachment = create_progress_attachment(
                task_db,
                attachment,
            )

            uploaded_files.append(attachment)



        # -----------------------------------------
        # ACTIVITY LOG
        # -----------------------------------------

        if uploaded_files:

            log_activity(
                db=asset_db,
                created_by=uploaded_by,
                module="TASK",
                action="UPLOAD_PROGRESS_ATTACHMENT",
                item_type="TASK_PROGRESS_ATTACHMENT",
                item_id=progress_id,
                item_name=f"Task Progress {progress_id}",
                notes=(
                    f"Uploaded {len(uploaded_files)} attachment(s) "
                    f"to task progress ID {progress_id}."
                ),
                changes={
                    "task_id": progress.task_id,
                    "progress_id": progress_id,
                    "files": [
                        {
                            "file_name": attachment.file_name,
                            "file_size": attachment.file_size
                        }
                        for attachment in uploaded_files
                    ]
                }
            )

        # -----------------------------------------
        # Notification
        # -----------------------------------------

        task = get_task_by_id(
            task_db,
            progress.task_id,
        )
        # notification = None

        # receiver = get_notification_receiver(
        #     task,
        #     uploaded_by,
        # )


        # if receiver:

        #     notification = notify_user(
        #         db=task_db,
        #         task_id=task.id,
        #         user_id=receiver,
        #         notification_type="attachment",
        #         title="New Attachment Uploaded",
        #         message=f"{len(uploaded_files)} attachment(s) uploaded to '{task.title}'.",
        #         created_by=uploaded_by,
        #     )
        # task_db.commit()

        # for attachment in uploaded_files:
        #     task_db.refresh(attachment)

        # if notification:
        #     await push_notification(notification)

        # -----------------------------------------
        # Notification
        # -----------------------------------------

        notifications = []

        receivers = get_notification_receivers(
            task,
            uploaded_by
        )

        for receiver in receivers:

            notification = notify_user(
                db=task_db,
                task_id=task.id,
                user_id=receiver,
                notification_type="attachment",
                title="New Attachment Uploaded",
                message=(
                    f"{len(uploaded_files)} attachment(s) "
                    f"uploaded to '{task.title}'."
                ),
                created_by=uploaded_by,
            )

            notifications.append(notification)


        task_db.commit()

        for notification in notifications:
            await push_notification(notification)

        return uploaded_files

    except HTTPException:
        task_db.rollback()
        raise

    except Exception as e:

        task_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload attachments: {str(e)}",
        )


def get_progress_attachments_service(
    db: Session,
    progress_id: int,
):
    try:

        progress = get_task_progress_by_id(
            db,
            progress_id,
        )

        if not progress:
            raise HTTPException(
                status_code=404,
                detail="Task progress not found."
            )

        return get_progress_attachments(
            db,
            progress_id,
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch attachments: {str(e)}",
        )


def delete_progress_attachment_service(
    task_db: Session,
    asset_db: Session,
    attachment_id: int,
    current_user
):
    try:

        attachment = get_progress_attachment_by_id(
            task_db,
            attachment_id,
        )

        if not attachment:
            raise HTTPException(
                status_code=404,
                detail="Attachment not found."
            )
        

        file_name = attachment.file_name
        progress_id = attachment.task_progress_id

        # Get progress so we know the task
        progress = get_task_progress_by_id(
            task_db,
            progress_id
        )

        task_id = (
            progress.task_id
            if progress
            else None
        )

        task = (
            get_task_by_id(
                task_db,
                task_id
            )
            if task_id
            else None
        )

        task_title = (
            task.title
            if task
            else f"Task ID {task_id}"
        )


        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)


        # -----------------------------------------

        log_activity(
            db=asset_db,
            created_by=current_user.id,
            module="TASK",
            action="DELETE_PROGRESS_ATTACHMENT",
            item_type="TASK_PROGRESS_ATTACHMENT",
            item_id=attachment.id,
            item_name=file_name,
            notes=(
                f"Deleted progress attachment "
                f"'{file_name}' from task "
                f"'{task_title}'."
            ),
            changes={
                "task_id": task_id,
                "progress_id": progress_id,
                "file_name": file_name,
                "file_size": attachment.file_size
            }
        )

        delete_progress_attachment(
            task_db,
            attachment,
        )

        task_db.commit()

        return {
            "message": "Attachment deleted successfully."
        }

    except HTTPException:
        task_db.rollback()
        raise

    except Exception as e:

        task_db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete attachment: {str(e)}",
        )

    
def download_attachment_service(
    task_db: Session,
    asset_db: Session,
    attachment_id: int,
    current_user
):
    try:

        attachment = get_progress_attachment_by_id(
            task_db,
            attachment_id,
        )

        print("Attachment:", attachment)
        if not attachment:
            raise HTTPException(
                status_code=404,
                detail="Attachment not found."
            )

        
    

        if not os.path.exists(attachment.file_path):
            raise HTTPException(
                status_code=404,
                detail="File not found on server."
            )

        progress = get_task_progress_by_id(
            task_db,
            attachment.task_progress_id
        )

        task = None

        if progress:
            task = get_task_by_id(
                task_db,
                progress.task_id
            )

        # -----------------------------------------
        # ACTIVITY LOG
        # -----------------------------------------

        log_activity(
            db=task_db,
            created_by=current_user.id,
            module="TASK",
            action="DOWNLOAD_PROGRESS_ATTACHMENT",
            item_type="TASK_PROGRESS_ATTACHMENT",
            item_id=attachment.id,
            item_name=attachment.file_name,
            notes=(
                f"Downloaded progress attachment "
                f"'{attachment.file_name}'"
                + (
                    f" from task '{task.title}'."
                    if task
                    else "."
                )
            ),
            changes={
                "task_id": (
                    progress.task_id
                    if progress
                    else None
                ),
                "progress_id": (
                    attachment.task_progress_id
                ),
                "file_name": attachment.file_name,
                "file_size": attachment.file_size
            }
        )


        return FileResponse(
            path=attachment.file_path,
            filename=attachment.file_name,
            media_type="application/octet-stream",
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )