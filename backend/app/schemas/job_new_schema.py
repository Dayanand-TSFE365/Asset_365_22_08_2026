from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict
from app.schemas.job_sub_job_schema import JobSubJobResponseSchema


class CreateJobNewSchema(BaseModel):

    # --------------------------
    # Job Information
    # --------------------------

    job_no: str

    customer_name: Optional[str] = None

    site_commissioned: Optional[str] = None

    so_no: Optional[str] = None

    mom_by: Optional[str] = None

    job_date: Optional[date] = None

    tested_by: Optional[str] = None

    end_user: Optional[str] = None

    job_status_id: Optional[int] = None

    remarks_action: Optional[str] = None

    # --------------------------
    # Sub Job Information
    # --------------------------

    panel_description: Optional[str] = None

    panel_quantity: Optional[int] = 1

    as_build: bool = False

    soft_copy: bool = False

    hard_copy: bool = False

    factory_test_report: bool = False

    bom_excel: bool = False

    bom_pdf: bool = False

    bom_updated_on_erp: bool = False

    bom_updated_on_tally: bool = False

    photos: bool = False

    notes_and_tech_note: bool = False

    additional_data: bool = False

    backup_file: bool = False

    mom_uploaded: bool = False

    remarks: Optional[str] = None


# Update
# =====================================================

class UpdateJobNewSchema(BaseModel):

    job_no: Optional[str] = None
    customer_name: Optional[str] = None
    site_commissioned: Optional[str] = None
    so_no: Optional[str] = None
    mom_by: Optional[str] = None
    job_date: Optional[date] = None
    tested_by: Optional[str] = None
    end_user: Optional[str] = None
    job_status_id: Optional[int] = None
    remarks_action: Optional[str] = None

    panel_description: Optional[str] = None
    panel_quantity: Optional[int] = None

    as_build: Optional[bool] = None
    soft_copy: Optional[bool] = None
    hard_copy: Optional[bool] = None
    factory_test_report: Optional[bool] = None

    bom_excel: Optional[bool] = None
    bom_pdf: Optional[bool] = None
    bom_updated_on_erp: Optional[bool] = None
    bom_updated_on_tally: Optional[bool] = None

    photos: Optional[bool] = None

    notes_and_tech_note: Optional[bool] = None
    additional_data: Optional[bool] = None
    backup_file: Optional[bool] = None
    mom_uploaded: Optional[bool] = None

    remarks: Optional[str] = None


# =====================================================
# Response
# =====================================================

class JobNewResponseSchema(BaseModel):

    job_id: int
    job_no: str

    customer_name: str | None = None
    site_commissioned: str | None = None

    so_no: str | None = None
    mom_by: str | None = None
    job_date: date | None = None

    tested_by: str | None = None
    end_user: str | None = None

    job_status_id: int | None = None
    remarks_action: str | None = None

    sub_jobs: list[JobSubJobResponseSchema] = []

    model_config = ConfigDict(
        from_attributes=True
    )

class CreateJobNewResponseSchema(BaseModel):
    message: str
    job_id: int
    job_no: str
    sub_job_id: int
    sub_job_no: str