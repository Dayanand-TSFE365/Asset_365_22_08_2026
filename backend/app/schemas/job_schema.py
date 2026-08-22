from pydantic import BaseModel
from typing import Optional
from datetime import datetime,date


class CreateJobSchema(BaseModel):
    job_no: str
    panel_description: Optional[str] = None
    panel_quantity: Optional[int] = None
    customer_name: Optional[str] = None

    as_build: Optional[bool] = False
    soft_copy: Optional[bool] = False
    hard_copy: Optional[bool] = False
    factory_test_report: Optional[bool] = False


    site_commissioned: Optional[str] = None

    bom_excel: Optional[bool] = False
    bom_pdf: Optional[bool] = False
    bom_updated_on_erp: Optional[bool] = False
    bom_updated_on_tally: Optional[bool] = False

    photos: Optional[bool] = False
    backup_file: Optional[bool] = False

    so_no: Optional[str] = None
    mom_by: Optional[str] = None
    mom_uploaded: Optional[bool] = False
    end_user: Optional[str] = None
    job_status_id: Optional[int] = None
    remarks_action: Optional[str] = None
    job_date: Optional[date] = None

    tested_by: Optional[str] = None


class UpdateJobSchema(BaseModel):
    job_no: Optional[str] = None
    panel_description: Optional[str] = None
    panel_quantity: Optional[int] = None
    customer_name: Optional[str] = None

    as_build: Optional[bool] = None
    soft_copy: Optional[bool] = None
    hard_copy: Optional[bool] = None
    factory_test_report: Optional[bool] = None

    site_commissioned: Optional[str] = None

    bom_excel: Optional[bool] = None
    bom_pdf: Optional[bool] = None
    bom_updated_on_erp: Optional[bool] = None
    bom_updated_on_tally: Optional[bool] = None
    end_user: Optional[str] = None
    job_status_id: Optional[int] = None
    remarks_action: Optional[str] = None

    photos: Optional[bool] = None
    backup_file: Optional[bool] = None

    so_no: Optional[str] = None
    mom_by: Optional[str] = None
    mom_uploaded: Optional[bool] = None

    job_date: Optional[date] = None

    tested_by: Optional[str] = None


class JobResponseSchema(BaseModel):
    job_id: int
    job_no: str
    panel_description: Optional[str]
    panel_quantity: Optional[int]
    customer_name: Optional[str]

    as_build: bool
    soft_copy: bool
    hard_copy: bool
    factory_test_report: bool

    site_commissioned: Optional[str]

    bom_excel: bool
    bom_pdf: bool
    bom_updated_on_erp: bool
    bom_updated_on_tally: bool

    end_user: Optional[str]
    job_status_id: Optional[int]    
    remarks_action: Optional[str]

    photos: bool
    backup_file: bool

    so_no: Optional[str]
    mom_by: Optional[str]
    mom_uploaded: bool

    tested_by: Optional[str]
    job_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UploadedFileSchema(BaseModel):
    file_id: int
    original_file_name: str
    stored_file_name: str
    file_type: str
    file_size: int

    
class MultipleUploadResponseSchema(BaseModel):
    message: str
    total_files: int
    files: list[UploadedFileSchema]

class JobStatusResponseSchema(BaseModel):
    status_id: int
    status_name: str
    display_order: int

    class Config:
        from_attributes = True