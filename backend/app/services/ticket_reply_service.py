from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings

from app.models.ticket_reply_model import (
    TicketReply
)

from app.models.ticket_attachment_model import (
    TicketAttachment
)

from app.repository.ticket_repo import (
    get_ticket_by_id_repo
)

from app.repository.ticket_reply_repo import (
    create_ticket_reply_repo
)

from app.repository.ticket_attachment_repo import (
    create_ticket_attachments_repo
)

from app.services.ticket_notification_service import (
    create_ticket_notification_service,
    push_ticket_notification
)

from app.services.ticket_notification_helper import (
    get_ticket_notification_receiver
)


async def create_ticket_reply_service(
    db: Session,
    ticket_id: int,
    message: str,
    files: list[UploadFile],
    sender_id: int
):

    # --------------------------------
    # Get Ticket
    # --------------------------------

    ticket = get_ticket_by_id_repo(
        db,
        ticket_id
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found."
        )

    # --------------------------------
    # Create Reply
    # --------------------------------

    reply = TicketReply(
        ticket_id=ticket_id,
        sender_id=sender_id,
        message=message
    )

    reply = create_ticket_reply_repo(
        db,
        reply
    )

    # --------------------------------
    # Save Attachments
    # --------------------------------

    attachments = []

    if files:

        base_upload_dir = Path(
            settings.UPLOAD_DIR
        )

        ticket_dir = (
            base_upload_dir
            / "ticket_chat"
            / ticket.ticket_no
        )

        ticket_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        for file in files:

            if not file.filename:
                continue

            extension = Path(
                file.filename
            ).suffix

            stored_file_name = (
                f"{uuid4()}{extension}"
            )

            full_path = (
                ticket_dir
                / stored_file_name
            )

            with open(
                full_path,
                "wb"
            ) as buffer:

                shutil.copyfileobj(
                    file.file,
                    buffer
                )

            attachment = TicketAttachment(

                ticket_id=ticket.id,

                reply_id=reply.id,

                original_file_name=file.filename,

                stored_file_name=stored_file_name,

                file_path=str(
                    Path("ticket_chat")
                    / ticket.ticket_no
                    / stored_file_name
                ),

                file_size=file.size or 0,

                file_extension=extension,

                mime_type=file.content_type,

                uploaded_by=sender_id
            )

            attachments.append(
                attachment
            )

        if attachments:

            create_ticket_attachments_repo(
                db,
                attachments
            )

            # Attach them to response object
            reply.attachments = attachments

    # --------------------------------
    # Create Notification
    # --------------------------------

    receiver_id = (
        get_ticket_notification_receiver(
            ticket=ticket,
            actor_id=sender_id
        )
    )

    if receiver_id:

        notification = (
            create_ticket_notification_service(

                db=db,

                ticket_id=ticket_id,

                user_id=receiver_id,

                notification_type="new_reply",

                title=(
                    f"New reply on "
                    f"{ticket.ticket_no}"
                ),

                message=message or "New attachment added to the ticket.",

                created_by=sender_id
            )
        )

        # Push real-time notification
        if notification:
            await push_ticket_notification(
                notification
        )

    # --------------------------------
    # Return Reply
    # --------------------------------

    return reply