from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


# 🔹 CREATE REQUEST
class AssetRequestCreate(BaseModel):
    asset_id: int
    requested_by: int
    expected_checkin_date: Optional[date] = None
    notes: Optional[str] = None


# 🔹 UPDATE REQUEST STATUS
class AssetRequestStatusUpdate(BaseModel):
    status: str
    approved_by: Optional[int] = None


# 🔹 RESPONSE SCHEMA
class AssetRequestResponse(BaseModel):
    request_id: int
    asset_id: int
    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    image_url: Optional[str] = None
    requested_by: int
    request_date: datetime
    expected_checkin_date: Optional[date]
    status: str
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    notes: Optional[str]

    class Config:
         from_attributes = True



# 🔹 UPDATE REQUEST
class AssetRequestUpdate(BaseModel):
    expected_checkin_date: Optional[date] = None
    notes: Optional[str] = None


# 🔹 CHECKOUT REQUEST
class AssetRequestCheckout(BaseModel):
    checked_out_by: int