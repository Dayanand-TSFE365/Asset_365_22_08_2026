from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class LicenseCreate(BaseModel):
    Software_name: Optional[str]=None
    product_key: Optional[str]

    total: int
    min_qty: Optional[int]=None

    category_id: Optional[int]
    company_id: Optional[int]
    manufacturer_id: Optional[int]
    supplier_id: Optional[int]

    licensed_to: Optional[str]
    licensed_to_email: Optional[str]

    reassignable: Optional[bool] = True
    maintained: Optional[bool] = False  

    order_number: Optional[str]
    purchase_order_number: Optional[str]

    purchase_cost: Optional[float]
    depreciation: Optional[float]

    purchase_date: Optional[date]
    expiration_date: Optional[date]
    termination_date: Optional[date]

    notes: Optional[str]
    
    
    
class LicenseResponse(BaseModel):
    license_id: int 
    Software_name: Optional[str]=None
    product_key: Optional[str]

    total: int
    available: int
    min_qty: Optional[int]

    category_id: Optional[int]
    company_id: Optional[int]
    manufacturer_id: Optional[int]
    supplier_id: Optional[int]

    licensed_to: Optional[str]
    licensed_to_email: Optional[str]
   

    reassignable: bool 
    maintained: bool

    order_number: Optional[str]
    purchase_order_number: Optional[str]

    purchase_cost: Optional[float]
    depreciation: Optional[float]

    purchase_date: Optional[date]
    expiration_date: Optional[date]
    termination_date: Optional[date]

    notes: Optional[str]

    class Config:
        from_attributes = True
        
        
class LicenseUpdate(BaseModel):
    Software_name: Optional[str]
    product_key: Optional[str]

    total: Optional[int]
    min_qty: Optional[int]

    category_id: Optional[int]
    company_id: Optional[int]
    manufacturer_id: Optional[int]
    supplier_id: Optional[int]

    licensed_to: Optional[str]
    licensed_to_email: Optional[str]

    reassignable: Optional[bool]
    maintained: Optional[bool]

    order_number: Optional[str]
    purchase_order_number: Optional[str]

    purchase_cost: Optional[float]
    depreciation: Optional[float]

    purchase_date: Optional[date]
    expiration_date: Optional[date]
    termination_date: Optional[date]

    notes: Optional[str]
        
        
        


class LicenseCheckout(BaseModel):
    # license_id: int
    user_id: int
    licensed_to: Optional[str]
    checkout_note: Optional[str]
    
    
class LicenseCheckin(BaseModel):
    user_id: Optional[int] = None
    checkin_note: Optional[str] = None