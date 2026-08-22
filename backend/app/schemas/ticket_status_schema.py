from pydantic import BaseModel
from datetime import datetime


class TicketStatusResponse(BaseModel):
    id: int
    status_name: str
    display_order: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class UpdateTicketStatusSchema(BaseModel):
    status_id: int