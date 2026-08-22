from datetime import (
    date,
    time,
    datetime
)
from typing import Optional, List

from pydantic import BaseModel

from app.schemas.ticket_reply_schema import (
    TicketReplyResponse
)


class CreateTicketSchema(BaseModel):

    scope_of_work: Optional[str] = None

    priority_id: int

    assigned_to: Optional[int] = None

    due_date: Optional[date] = None

    customer_name: Optional[str] = None

    meeting_date: Optional[date] = None

    meeting_time: Optional[time] = None

    venue: Optional[str] = None

    order_no: Optional[str] = None

    agenda: Optional[str] = None


class UpdateTicketSchema(BaseModel):

    scope_of_work: Optional[str] = None

    priority_id: Optional[int] = None

    assigned_to: Optional[int] = None

    status_id: Optional[int] = None

    due_date: Optional[date] = None

    customer_name: Optional[str] = None

    meeting_date: Optional[date] = None

    meeting_time: Optional[time] = None

    venue: Optional[str] = None

    order_no: Optional[str] = None

    agenda: Optional[str] = None


class TicketResponse(BaseModel):

    id: int

    ticket_no: str

    scope_of_work: Optional[str]

    priority_id: int

    status_id: int

    assigned_to: Optional[int]

    created_by: int

    due_date: Optional[date]

    customer_name: Optional[str]

    meeting_date: Optional[date]

    meeting_time: Optional[time]

    venue: Optional[str]

    order_no: Optional[str]

    agenda: Optional[str]

    closed_at: Optional[datetime]

    created_at: datetime

    updated_at: datetime

    is_deleted: bool

    replies: List[TicketReplyResponse] = []

    model_config = {
        "from_attributes": True
    }


class TicketListResponse(BaseModel):

    id: int

    ticket_no: str

    scope_of_work: Optional[str]

    priority_id: int

    status_id: int

    assigned_to: Optional[int]

    created_by: int

    due_date: Optional[date]

    customer_name: Optional[str]

    meeting_date: Optional[date]

    venue: Optional[str]

    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class AssignTicketSchema(BaseModel):

    assigned_to: int