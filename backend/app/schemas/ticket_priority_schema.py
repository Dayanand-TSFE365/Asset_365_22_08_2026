from pydantic import BaseModel
from datetime import datetime


class TicketPriorityResponse(BaseModel):
    id: int
    priority_name: str
    display_order: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }