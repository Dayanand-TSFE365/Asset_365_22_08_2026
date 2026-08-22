from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from datetime import date

#  RESPONSE (GET)
class AssetResponse(BaseModel):
    asset_id: int
    asset_tag: str
    asset_name: Optional[str] =None
    serial_number: Optional[str]=None

    image_url: Optional[str]=None

    # 🔹 Relations
    company_id: Optional[int]=None
    model_id: Optional[int]=None
    status_id: Optional[int]=None 
    supplier_id: Optional[int]=None

    checked_out_to: Optional[int]=None
    location_id: Optional[int]=None

    # 🔹 Financial
    purchase_cost: Optional[float]=None

    depreciation_months: Optional[int] = None
   

    # 🔹 Dates
    purchase_date: Optional[date]=None
    expected_checkin_date: Optional[date]=None
    next_audit_date: Optional[date]=None
    warranty_months: Optional[int] = None
    warranty_expires: Optional[date]=None   

    # 🔹 Other
    order_number: Optional[str]=None
    notes: Optional[str]=None
    condition: Optional[str] = None
    
    eol_date: Optional[date] = None

    # 🔹 Audit
    created_at: datetime
    updated_at: datetime
    
    current_value: Optional[float] = None
    
    requestable: Optional[bool] = False
    byod: Optional[bool] = False
    
    # is_deleted: Optional[bool] = False

    class Config:
        from_attributes = True


#  CREATE (POST)







class AssetCreate(BaseModel):

    # 🔹 Basic
    asset_tag: str
    asset_name: str
    serial_number: str

    # 🔹 Relations
    company_id: int
    model_id: int
    status_id: int
    checked_out_to: Optional[int]=None 
    location_id: Optional[int] = None
    supplier_id: Optional[int] = None

    # 🔹 Financial
    purchase_cost: Optional[float] = None

    depreciation_months: Optional[int] = None

    # 🔹 Dates
    purchase_date: Optional[date] = None 
    expected_checkin_date: Optional[date]=None
    next_audit_date: Optional[date]=None
    warranty_months: Optional[int]=None
    warranty_expires: Optional[date]=None

    # 🔹 Other
    order_number: Optional[str]=None
    notes: Optional[str]=None
    condition: Optional[str]=None
    current_value: Optional[float] = None
    eol_date: Optional[date] = None

    image_url: Optional[str]=None
    
    requestable: Optional[bool] = False
    byod: Optional[bool] = False
    
    
    
    
# 🔹 UPDATE (PUT)
class AssetUpdate(BaseModel):

    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    serial_number: Optional[str] = None

    image_url: Optional[str] = None

    # 🔹 Relations
    company_id: Optional[int] = None
    model_id: Optional[int] = None
    status_id: Optional[int] = None
    supplier_id: Optional[int] = None

    checked_out_to: Optional[int] = None
    location_id: Optional[int] = None

    # 🔹 Financial
    purchase_cost: Optional[float] = None
    current_value: Optional[float] = None

    depreciation_months: Optional[int] = None

    # 🔹 Dates
    purchase_date: Optional[date] = None
    expected_checkin_date: Optional[date] = None
    next_audit_date: Optional[date] = None
    warranty_months: Optional[int] = None
    warranty_expires: Optional[date] = None

    # 🔹 Other
    order_number: Optional[str] = None
    notes: Optional[str] = None
    condition: Optional[str] = None
    
    current_value: Optional[float] = None
    
    eol_date: Optional[date] = None
    
    requestable: Optional[bool] = False
    byod: Optional[bool] = False
    
    
    



class DeleteResponse(BaseModel):
    message: str
    
    
class CheckoutRequest(BaseModel):
    user_id: int
    checkout_date: date
    expected_checkin_date: Optional[date] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True
    
    
class CheckinRequest(BaseModel):
    location_id: int
    checkin_date: Optional[date] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True