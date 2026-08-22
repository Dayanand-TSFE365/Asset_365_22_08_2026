from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class CreateTicketDailyTaskSchema(BaseModel):
    task_description: str
    work_date: Optional[date] = None


class UpdateTicketDailyTaskSchema(BaseModel):
    task_description: Optional[str] = None
    work_date: Optional[date] = None


class UpdateTicketDailyTaskSelectionSchema(BaseModel):
    is_selected: bool


class TicketDailyTaskResponse(BaseModel):
    id: int

    ticket_id: int

    task_description: str

    is_selected: bool

    work_date: date

    created_by: int

    created_at: datetime

    updated_at: Optional[datetime]

    model_config = {
        "from_attributes": True
    }

class BulkDailyTaskItem(BaseModel):
    task_description: str
    work_date: Optional[date] = None


class BulkCreateDailyTaskSchema(BaseModel):
    tasks: List[BulkDailyTaskItem]