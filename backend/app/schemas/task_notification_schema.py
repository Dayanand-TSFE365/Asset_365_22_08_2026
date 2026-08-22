from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ==========================================================
# Notification Create
# ==========================================================

class TaskNotificationCreate(BaseModel):

    task_id: int

    user_id: int

    notification_type: str

    title: str

    message: Optional[str] = None

    created_by: int


# ==========================================================
# Notification Response
# ==========================================================

class TaskNotificationResponse(BaseModel):

    id: int

    task_id: int

    user_id: int

    notification_type: str

    title: str

    message: Optional[str]

    is_read: bool

    created_by: int

    created_at: datetime

    read_at: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================================
# Mark Read
# ==========================================================

class NotificationRead(BaseModel):

    is_read: bool = True