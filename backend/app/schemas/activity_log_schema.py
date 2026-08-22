from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ActivityLogResponse(BaseModel):

    id: int

    created_at: datetime

    created_by: int

    module: str

    action: str

    item_type: str

    item_id: int

    item_name: str

    target_user_id: Optional[int]

    quantity: Optional[int]

    notes: Optional[str]

    changes: Optional[str]

    class Config:
        orm_mode = True