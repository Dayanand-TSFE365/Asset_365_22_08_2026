from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ----------------------------------------------------
# Attachment Response
# ----------------------------------------------------

class TaskProgressAttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    uploaded_by: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Create Progress
# ----------------------------------------------------

class TaskProgressCreate(BaseModel):
    message: str
    hours_worked: Optional[float] = None
    hours_remaining: Optional[float] = None
    progress: int
    blockers: Optional[str] = None


# ----------------------------------------------------
# Update Progress
# ----------------------------------------------------

class TaskProgressUpdate(BaseModel):
    message: Optional[str] = None
    hours_worked: Optional[float] = None
    hours_remaining: Optional[float] = None
    progress: Optional[int] = None
    blockers: Optional[str] = None


# ----------------------------------------------------
# Progress Response
# ----------------------------------------------------

class TaskProgressResponse(BaseModel):
    id: int
    task_id: int
    message: str
    hours_worked: Optional[float]
    hours_remaining: Optional[float]
    progress: int
    blockers: Optional[str]
    created_by: int
    created_at: datetime

    attachments: List[TaskProgressAttachmentResponse] = []

    class Config:
        from_attributes = True