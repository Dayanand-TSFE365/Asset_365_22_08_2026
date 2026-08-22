from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ComponentCreate(BaseModel):
    name: str

    company_id: Optional[int]
    category_id: Optional[int]
    supplier_id: Optional[int]
    manufacturer_id: Optional[int]
    location_id: Optional[int]
    image_url: Optional[str]=None
    serial_no: Optional[str]
    model_no: Optional[str]
    order_number: Optional[str]

    purchase_date: Optional[date]

    min_qty: Optional[int] = 0
    total_qty: Optional[int] = 0

    unit_cost: Optional[float]
    notes: Optional[str]


class ComponentResponse(BaseModel):
    id: int
    name: str

    company_id: Optional[int]
    category_id: Optional[int]
    supplier_id: Optional[int]
    manufacturer_id: Optional[int]
    location_id: Optional[int]
    image_url: Optional[str]=None

    serial_no: Optional[str]
    model_no: Optional[str]
    order_number: Optional[str]

    purchase_date: Optional[date]

    min_qty: int
    total_qty: int
    remaining_qty: int

    unit_cost: Optional[float]
    total_cost: Optional[float]

    notes: Optional[str]
   

    created_by: Optional[int]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
        
class ComponentUpdate(BaseModel):
    name: Optional[str]

    company_id: Optional[int]
    category_id: Optional[int]
    supplier_id: Optional[int]
    manufacturer_id: Optional[int]
    location_id: Optional[int]

    image_url: Optional[str]

    serial_no: Optional[str]
    model_no: Optional[str]
    order_number: Optional[str]

    purchase_date: Optional[date]

    min_qty: Optional[int]
    total_qty: Optional[int]

    unit_cost: Optional[float]
    notes: Optional[str]
   

    
class ComponentCheckout(BaseModel):
    quantity: int
    notes: Optional[str]
    user_id: Optional[int] = None 


class ComponentCheckin(BaseModel):
    quantity: int
    notes: Optional[str]
    user_id: Optional[int] = None
    
    
class ComponentTransactionResponse(BaseModel):
    id: int
    component_id: int
    user_id: int
    type: str
    quantity: int
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
