from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# -----------------------------
# CREATE
# -----------------------------

class AssetMaintenanceCreate(BaseModel):

    title: Optional[str] = None

    maintenance_type: Optional[str] = None
    # repair / upgrade / inspection

    status: Optional[str] = "pending"

    start_date: Optional[date] = None

    expected_completion_date: Optional[date] = None

    completion_date: Optional[date] = None

    cost: Optional[float] = None

    warranty: Optional[bool] = False

    vendor: Optional[str] = None

    ticket_url: Optional[str] = None

    notes: Optional[str] = None


# -----------------------------
# UPDATE
# -----------------------------

class AssetMaintenanceUpdate(BaseModel):

    title: Optional[str] = None

    maintenance_type: Optional[str] = None

    status: Optional[str] = None

    start_date: Optional[date] = None

    expected_completion_date: Optional[date] = None

    completion_date: Optional[date] = None

    cost: Optional[float] = None

    warranty: Optional[bool] = None

    vendor: Optional[str] = None

    ticket_url: Optional[str] = None

    notes: Optional[str] = None


# -----------------------------
# RESPONSE
# -----------------------------

class AssetMaintenanceResponse(BaseModel):

    maintenance_id: int

    asset_id: int

    title: Optional[str]

    maintenance_type: Optional[str]

    status: Optional[str]

    start_date: Optional[date]

    expected_completion_date: Optional[date]

    completion_date: Optional[date]

    cost: Optional[float]

    warranty: Optional[bool]

    vendor: Optional[str]

    ticket_url: Optional[str]

    notes: Optional[str]

    created_by: Optional[int]

    created_at: Optional[datetime]

    class Config:

        from_attributes = True