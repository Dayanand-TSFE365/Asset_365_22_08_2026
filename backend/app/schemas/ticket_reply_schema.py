from pydantic import BaseModel
from datetime import datetime
from typing import List

from app.schemas.ticket_attachment_schema import (
    TicketAttachmentResponse
)


class CreateTicketReplySchema(BaseModel):
    message: str


class UpdateTicketReplySchema(BaseModel):
    message: str


class TicketReplyResponse(BaseModel):
    id: int
    ticket_id: int
    sender_id: int
    message: str

    created_at: datetime
    updated_at: datetime

    attachments: List[TicketAttachmentResponse] = []

    model_config = {
        "from_attributes": True
    }