from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobFileResponseSchema(BaseModel):
    file_id: int
    job_id: int
    file_type: str
    original_file_name: Optional[str] = None
    stored_file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by: Optional[int] = None
    uploaded_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True


from enum import Enum


class FileType(str, Enum):
    AS_BUILD = "AS_BUILD"
    SOFT_COPY = "SOFT_COPY"
    HARD_COPY = "HARD_COPY"
    # PROJECT_DETAILS = "PROJECT_DETAILS"
    FACTORY_TEST_REPORT = "FACTORY_TEST_REPORT"
    SITE_COMMISSIONED = "SITE_COMMISSIONED"
    BOM = "BOM"
    PHOTOS = "PHOTOS"
    # BACKUP = "BACKUP"
    PLC_BACKUP = "PLC_BACKUP"
    SCADA_BACKUP = "SCADA_BACKUP"
    OTHER_BACKUP = "OTHER_BACKUP"

    NOTES_AND_TECH_NOTE = "NOTES_AND_TECH_NOTE"
    ADDITIONAL_DATA = "ADDITIONAL_DATA"
    
    MOM = "MOM"