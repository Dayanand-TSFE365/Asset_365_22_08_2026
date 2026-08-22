from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

class AccessoryCreate(BaseModel):
    name: str
    company_id: Optional[int]
    category_id: Optional[int]
    supplier_id: Optional[int]
    manufacturer_id: Optional[int]
    location_id: Optional[int]
   

    model_no: Optional[str]
    order_number: Optional[str]

    purchase_date: Optional[date]

    unit_cost: Optional[float]

    quantity: int = Field(..., gt=0)
    min_qty: Optional[int] = Field(0, ge=0)

    notes: Optional[str]
    
    
    
    
class AccessoryResponse(BaseModel):
    accessory_id: int
    name: str

    company_id: Optional[int]
    category_id: Optional[int]

    model_no: Optional[str]

    manufacturer_id: Optional[int]
    supplier_id: Optional[int]
    location_id: Optional[int]
    
  

    total_qty: int
    available_qty: int
    checked_out_qty: int
    min_qty: int

    purchase_date: Optional[date]

    unit_cost: Optional[float]
    total_cost: Optional[float]

    order_number: Optional[str]
    notes: Optional[str]
    image_url: Optional[str]

    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[int]

    class Config:
        from_attributes = True
        
        
class AccessoryUpdate(BaseModel):
    name: Optional[str]
    company_id: Optional[int]
    category_id: Optional[int]
    supplier_id: Optional[int]
    manufacturer_id: Optional[int]
    location_id: Optional[int]

    model_no: Optional[str]
    order_number: Optional[str]
    

    purchase_date: Optional[date]

    unit_cost: Optional[float]

    quantity: Optional[int] = Field(None, gt=0)  # total_qty
    min_qty: Optional[int]

    notes: Optional[str]
    

        
class AccessoryCheckout(BaseModel):
    accessory_id: int
    user_id: int
    quantity: int= Field(..., gt=0)
    notes: Optional[str] = None
    
    
class AccessoryCheckin(BaseModel):
    accessory_id: int
    user_id: int   # ADD THIS
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None