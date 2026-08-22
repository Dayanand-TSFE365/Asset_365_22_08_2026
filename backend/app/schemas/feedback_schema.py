from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):

    rating: int = Field(
        ...,
        ge=1,
        le=5
    )

    category: str = Field(
        ...,
        min_length=2,
        max_length=50
    )

    subject: str = Field(
        ...,
        min_length=2,
        max_length=200
    )

    message: str = Field(
        ...,
        min_length=5
    )


class FeedbackUpdate(BaseModel):

    status: Optional[str] = None

    admin_response: Optional[str] = None


class FeedbackResponse(BaseModel):

    id: int
    user_id: int
    rating: int
    category: str
    subject: str
    message: str
    status: str
    admin_response: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True