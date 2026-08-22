from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateJobUserPermissionSchema(BaseModel):
    job_id: int
    user_id: int

    # Job Permission
    can_view: Optional[bool] = False

    # File Permissions
    can_upload_file: Optional[bool] = False
    can_view_file: Optional[bool] = False
    can_download_file: Optional[bool] = False
    can_delete_file: Optional[bool] = False


class UpdateJobUserPermissionSchema(BaseModel):
    # Job Permission
    can_view: Optional[bool] = None

    # File Permissions
    can_upload_file: Optional[bool] = None
    can_view_file: Optional[bool] = None
    can_download_file: Optional[bool] = None
    can_delete_file: Optional[bool] = None


class JobUserPermissionResponseSchema(BaseModel):
    permission_id: int

    job_id: int
    user_id: int

    # Job Permission
    can_view: bool

    # File Permissions
    can_upload_file: bool
    can_view_file: bool
    can_download_file: bool
    can_delete_file: bool

    assigned_by: Optional[int]
    assigned_at: datetime

    class Config:
        from_attributes = True