from sqlalchemy.orm import Session

from app.models.ticket_attachment_model import (
    TicketAttachment
)


def create_ticket_attachments_repo(
    db: Session,
    attachments: list[TicketAttachment]
):
    db.add_all(attachments)

    db.commit()

    for attachment in attachments:
        db.refresh(attachment)

    return attachments


def get_ticket_attachments_repo(
    db: Session,
    ticket_id: int
):
    return (
        db.query(TicketAttachment)
        .filter(
            TicketAttachment.ticket_id == ticket_id,
            TicketAttachment.is_deleted == False
        )
        .order_by(TicketAttachment.uploaded_at.asc())
        .all()
    )


def get_reply_attachments_repo(
    db: Session,
    reply_id: int
):
    return (
        db.query(TicketAttachment)
        .filter(
            TicketAttachment.reply_id == reply_id,
            TicketAttachment.is_deleted == False
        )
        .order_by(TicketAttachment.uploaded_at.asc())
        .all()
    )


def get_ticket_attachment_by_id_repo(
    db: Session,
    attachment_id: int
):
    return (
        db.query(TicketAttachment)
        .filter(
            TicketAttachment.id == attachment_id,
            TicketAttachment.is_deleted == False
        )
        .first()
    )


def update_ticket_attachment_repo(
    db: Session,
    attachment: TicketAttachment
):
    db.commit()
    db.refresh(attachment)

    return attachment


def delete_ticket_attachment_repo(
    db: Session,
    attachment: TicketAttachment
):
    attachment.is_deleted = True

    db.commit()
    db.refresh(attachment)

    return attachment


def get_ticket_attachment_by_stored_name_repo(
    db: Session,
    stored_file_name: str
):
    return (
        db.query(TicketAttachment)
        .filter(
            TicketAttachment.stored_file_name == stored_file_name,
            TicketAttachment.is_deleted == False
        )
        .first()
    )

def delete_reply_attachments_repo(
    db: Session,
    reply_id: int
):
    attachments = (
        db.query(TicketAttachment)
        .filter(
            TicketAttachment.reply_id == reply_id,
            TicketAttachment.is_deleted == False
        )
        .all()
    )

    for attachment in attachments:
        attachment.is_deleted = True

    db.commit()

    return attachments


