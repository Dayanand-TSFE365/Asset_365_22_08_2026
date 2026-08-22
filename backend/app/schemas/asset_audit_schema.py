from pydantic import BaseModel
from typing import Optional
from datetime import date,datetime




class AssetAuditResponse(BaseModel):

    audit_id: int

    asset_id: int

    audited_by: Optional[int]

    audit_date: datetime

    status: Optional[str]

    remarks: Optional[str]

    next_audit_date: Optional[date]

    image_url: Optional[str]

    class Config:
        from_attributes = True

class AuditRequest(BaseModel):
    location_id: int
    update_location: bool = False
    next_audit_date: Optional[date] = None
    notes: Optional[str] = None

