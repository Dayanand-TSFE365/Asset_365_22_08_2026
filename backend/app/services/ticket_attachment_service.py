import os
from pathlib import Path

from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.core.config import settings

from app.repository.ticket_attachment_repo import (
    get_ticket_attachment_by_id_repo,
    delete_ticket_attachment_repo
)


def sanitize_filename(
    filename: str
) -> str:
    """
    Remove invalid characters from filename.
    """

    invalid_chars = '<>:"/\\|?*'

    for ch in invalid_chars:
        filename = filename.replace(
            ch,
            "_"
        )

    return filename.strip()


def get_unique_filename(
    folder_path: str,
    filename: str
):
    """
    Example:

        report.pdf

        report_1.pdf

        report_2.pdf
    """

    filename = sanitize_filename(
        filename
    )

    name = Path(filename).stem

    extension = Path(filename).suffix

    stored_name = filename

    counter = 1

    while os.path.exists(
        os.path.join(
            folder_path,
            stored_name
        )
    ):

        stored_name = (
            f"{name}_{counter}{extension}"
        )

        counter += 1

    return stored_name


def download_ticket_attachment_service(
    db,
    attachment_id: int
):

    attachment = get_ticket_attachment_by_id_repo(
        db,
        attachment_id
    )

    if not attachment:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found."
        )

    file_path = (
        Path(settings.UPLOAD_DIR)
        / attachment.file_path
    )

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    return FileResponse(
        path=file_path,
        filename=attachment.original_file_name,
        media_type=attachment.mime_type
    )


def delete_ticket_attachment_service(
    db,
    attachment_id: int
):

    attachment = get_ticket_attachment_by_id_repo(
        db,
        attachment_id
    )

    if not attachment:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found."
        )

    file_path = (
        Path(settings.UPLOAD_DIR)
        / attachment.file_path
    )

    if file_path.exists():

        os.remove(
            file_path
        )

    delete_ticket_attachment_repo(
        db,
        attachment
    )

    return {
        "message": "Attachment deleted successfully."
    }