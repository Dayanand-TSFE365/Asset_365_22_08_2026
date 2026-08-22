from pydantic import BaseModel
from typing import Optional
from datetime import date


class AssetReportRequest(BaseModel):

    # =====================================
    # COLUMNS
    # =====================================

    columns: list[str]

    # =====================================
    # PAGINATION
    # =====================================

    page: Optional[int] = 1
    page_size: Optional[int] = 50

    # =====================================
    # RELATION FILTERS
    # =====================================

    company_id: Optional[int] = None
    model_id: Optional[int] = None
    status_id: Optional[int] = None
    location_id: Optional[int] = None
    supplier_id: Optional[int] = None

    # =====================================
    # ASSET FILTERS
    # =====================================

    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    serial_number: Optional[str] = None
    order_number: Optional[str] = None
    condition: Optional[str] = None

    # =====================================
    # DATE FILTERS
    # =====================================

    purchase_date_from: Optional[date] = None
    purchase_date_to: Optional[date] = None

    warranty_expires_from: Optional[date] = None
    warranty_expires_to: Optional[date] = None

    next_audit_date_from: Optional[date] = None
    next_audit_date_to: Optional[date] = None

    created_at_from: Optional[date] = None
    created_at_to: Optional[date] = None

    # =====================================
    # BOOLEAN FILTERS
    # =====================================

    assigned: Optional[bool] = None
    deleted: Optional[bool] = None
    requestable: Optional[bool] = None
    byod: Optional[bool] = None

    # =====================================
    # SORTING
    # =====================================

    sort_by: Optional[str] = None
    sort_order: Optional[str] = "asc"

    # =====================================
    # EXPORT
    # =====================================

    export: Optional[str] = None