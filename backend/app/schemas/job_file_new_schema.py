from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class JobFileNewResponseSchema(BaseModel):

    file_id: int

    sub_job_id: int

    file_type: str

    original_file_name: str

    stored_file_name: str

    file_path: str

    file_size: Optional[int] = None

    uploaded_by: Optional[int] = None

    uploaded_at: datetime

    is_deleted: bool

    model_config = ConfigDict(
        from_attributes=True
    )

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