from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict
)


class TicketNotificationResponse(
    BaseModel
):

    id: int

    ticket_id: int

    user_id: int

    notification_type: str

    title: str

    message: str

    created_by: int

    created_at: datetime

    is_read: bool

    model_config = ConfigDict(
        from_attributes=True
    )