from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class QRJobFileResponseSchema(BaseModel):

    file_id: int

    sub_job_id: int

    file_type: str

    original_file_name: str

    file_size: Optional[int] = None

    uploaded_by: Optional[int] = None

    uploaded_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class QRJobResponseSchema(BaseModel):

    job_id: int

    job_no: str

    files: list[QRJobFileResponseSchema]