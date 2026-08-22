from datetime import datetime
from decimal import Decimal
from typing import List, Optional,Literal

from pydantic import BaseModel, ConfigDict,Field


# ==========================================================
# Checklist Schemas
# ==========================================================

# class ChecklistCreate(BaseModel):
#     title: str

class ChecklistCreate(BaseModel):
    title: str
    is_completed: bool = False


class ChecklistResponse(BaseModel):
    id: int
    title: str
    is_completed: bool

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Attachment Schemas
# ==========================================================

class TaskAttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    uploaded_by: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# Create Task
# ==========================================================

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None

    assigned_to: Optional[int] = None

    priority: str = "Medium"

    department: Optional[str] = None

    estimated_hours: Optional[Decimal] = None

    deadline: Optional[datetime] = None

  

    checklists: List[ChecklistCreate] = []


# ==========================================================
# Update Task
# ==========================================================

class TaskUpdate(BaseModel):
    title: Optional[str] = None

    description: Optional[str] = None

    assigned_to: Optional[int] = None

    priority: Optional[str] = None

    department: Optional[str] = None

    estimated_hours: Optional[Decimal] = None

    deadline: Optional[datetime] = None

    # status: Optional[str] = None

    # project_id: Optional[int] = None


# ==========================================================
# Assign Task
# ==========================================================

# class TaskAssign(BaseModel):
#     assignee_id: int
#     reason: Optional[str] = None
#     note: Optional[str] = None

# class TaskAssign(BaseModel):
#     assigned_to: int
#     reason: Optional[str] = None
#     notify_old: bool = False
#     reset_progress: bool = False

class TaskAssign(BaseModel):
    assigned_to: int
    note: Optional[str] = None
    reason: Optional[str] = None
    notify_old: bool = False
    reset_progress: bool = False


# ==========================================================
# Task Response
# ==========================================================

class TaskResponse(BaseModel):
    id: int

    title: str
    description: Optional[str]

    status: str
    priority: str

    department: Optional[str]

    estimated_hours: Optional[Decimal]

    deadline: Optional[datetime]

    created_by: int

    assigned_to: Optional[int]

    is_deleted: bool

    created_at: datetime
    updated_at: datetime

    attachments: List[TaskAttachmentResponse] = []

    checklists: List[ChecklistResponse] = []

    model_config = ConfigDict(from_attributes=True)




class TaskCloseSchema(BaseModel):
    decision: Literal["approve", "reject"]
    comment: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)


# class TaskChecklistUpdate(BaseModel):
#     is_completed: bool

class TaskChecklistUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None