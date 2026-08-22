from pydantic import BaseModel
from datetime import datetime

class DropdownResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
        
        
class ModelCreate(BaseModel):
    model_name: str
    category_id: int
    manufacturer_id: int
    
    
class CategoryCreate(BaseModel):
    name: str

class StatusCreate(BaseModel):
    name: str

class UserCreate(BaseModel):
    name: str
    email: str

class LocationCreate(BaseModel):
    location_name: str
    
    
class CompanyCreate(BaseModel):
    company_name: str
    
    
    
class ManufacturerCreate(BaseModel):
    name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    created_at: datetime | None = None


class SupplierCreate(BaseModel):
    name: str
    contact_person: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    created_at: datetime | None = None