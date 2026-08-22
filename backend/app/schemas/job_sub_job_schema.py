from pydantic import BaseModel, ConfigDict

class JobSubJobResponseSchema(BaseModel):
    sub_job_id: int
    sub_job_no: str

    panel_description: str | None = None
    panel_quantity: int | None = None

    as_build: bool
    soft_copy: bool
    hard_copy: bool
    factory_test_report: bool

    bom_excel: bool
    bom_pdf: bool
    bom_updated_on_erp: bool
    bom_updated_on_tally: bool

    photos: bool
    notes_and_tech_note: bool
    additional_data: bool
    backup_file: bool
    mom_uploaded: bool

    remarks: str | None = None

    model_config = ConfigDict(from_attributes=True)




class UpdateSubJobSchema(BaseModel):

    panel_description: str | None = None
    panel_quantity: int | None = None

    as_build: bool | None = None
    soft_copy: bool | None = None
    hard_copy: bool | None = None
    factory_test_report: bool | None = None

    bom_excel: bool | None = None
    bom_pdf: bool | None = None
    bom_updated_on_erp: bool | None = None
    bom_updated_on_tally: bool | None = None

    photos: bool | None = None
    notes_and_tech_note: bool | None = None
    additional_data: bool | None = None
    backup_file: bool | None = None
    mom_uploaded: bool | None = None

    remarks: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )