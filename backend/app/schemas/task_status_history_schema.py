from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# --------------------------------------------
# Update Task Status
# --------------------------------------------

class TaskStatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None


# --------------------------------------------
# Task Status History Response
# --------------------------------------------

class TaskStatusHistoryResponse(BaseModel):
    id: int

    task_id: int

    old_status: str

    new_status: str

    remarks: Optional[str]

    changed_by: int

    changed_at: datetime

    class Config:
        from_attributes = True