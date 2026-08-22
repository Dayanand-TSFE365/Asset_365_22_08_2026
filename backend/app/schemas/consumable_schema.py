# app/schemas/consumable_schema.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class ConsumableCreate(BaseModel):
    name: str
    company_id: Optional[int]
    category_id: Optional[int]
    supplier_id: Optional[int]
    manufacturer_id: Optional[int]
    location_id: Optional[int]

    model_no: Optional[str]
    item_no: Optional[str]
    order_number: Optional[str]

    purchase_date: Optional[date]

    unit_cost: Optional[float]

    quantity: int
    min_qty: Optional[int] = 0

    notes: Optional[str]
    
    
# UPDATE (all optional)
class ConsumableUpdate(BaseModel):
    name: Optional[str]
    company_id: Optional[int]
    category_id: Optional[int]
    supplier_id: Optional[int]
    manufacturer_id: Optional[int]
    location_id: Optional[int]

    model_no: Optional[str]
    item_no: Optional[str]
    order_number: Optional[str]

    purchase_date: Optional[date]

    unit_cost: Optional[float]

    quantity: Optional[int]
    min_qty: Optional[int]

    notes: Optional[str]


#  RESPONSE (for GET APIs)
class ConsumableResponse(BaseModel):
    consumable_id: int
    name: str
    image_url: Optional[str]

    company_id: Optional[int]
    category_id: Optional[int]
    supplier_id: Optional[int]
    manufacturer_id: Optional[int]
    location_id: Optional[int]

    model_no: Optional[str]
    item_no: Optional[str]
    order_number: Optional[str]

    purchase_date: Optional[date]

    total_qty: int
    remaining_qty: int
    min_qty: int

    unit_cost: Optional[float]
    total_cost: Optional[float]

    notes: Optional[str]

    created_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
        
        
class ConsumableConsume(BaseModel):
    consumable_id: int
    user_id: Optional[int]
    quantity: int
    notes: Optional[str] = None
    
    
class ConsumableAddStock(BaseModel):
    consumable_id: int
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None