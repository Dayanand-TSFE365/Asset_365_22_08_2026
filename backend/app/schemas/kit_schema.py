from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from pydantic import BaseModel, Field


# 🔹 Create Kit
class KitCreate(BaseModel):
    name: str
   
    

class KitResponse(BaseModel):
    id: int
    name: str
    created_by: int | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
        
class KitUpdate(BaseModel):
    name: str


class KitItemCreate(BaseModel):
    item_type: str = Field(..., example="asset")
    item_ref_id: int = Field(..., example=10)
    quantity: int = Field(default=1, gt=0)


class KitItemResponse(BaseModel):
    id: int
    item_type: str
    item_ref_id: int
    quantity: int

    class Config:
        from_attributes = True


# 🔹 Full Kit Response
class KitWithItemsResponse(BaseModel):
    id: int
    name: str
    items: List[KitItemResponse] = []

    class Config:
        from_attributes = True
        
        
        
class KitCheckout(BaseModel):
    user_id: int
    checkout_date: Optional[datetime] = None
    expected_checkin_date: Optional[datetime] = None
    notes: Optional[str] = None
        
        
        
class KitItemUpdate(BaseModel):
    quantity: int