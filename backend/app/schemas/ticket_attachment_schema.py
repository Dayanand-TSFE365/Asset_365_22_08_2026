from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TicketAttachmentResponse(BaseModel):

    id: int

    ticket_id: int

    reply_id: Optional[int] = None

    original_file_name: str

    stored_file_name: str

    file_path: str

    file_size: int

    file_extension: Optional[str] = None

    mime_type: Optional[str] = None

    uploaded_by: int

    uploaded_at: datetime

    model_config = {
        "from_attributes": True
    }