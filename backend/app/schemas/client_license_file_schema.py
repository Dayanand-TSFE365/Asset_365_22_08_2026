from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LicenseFileResponseSchema(BaseModel):

    file_id: int
    license_id: int

    original_file_name: str
    stored_file_name: str

    file_path: str
    file_size: int

    uploaded_by: int | None = None
    uploaded_at: datetime

    is_deleted: bool

    model_config = ConfigDict(
        from_attributes=True
    )


class UploadedLicenseFileSchema(BaseModel):

    file_id: int

    original_file_name: str

    stored_file_name: str

    file_size: int


class MultipleLicenseFileUploadResponseSchema(BaseModel):

    message: str

    total_files: int

    files: list[
        UploadedLicenseFileSchema
    ]