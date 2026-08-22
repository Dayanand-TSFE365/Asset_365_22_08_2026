# schemas/asset_computer_schema.py

from pydantic import BaseModel
from datetime import date,datetime
from decimal import Decimal
from typing import Optional


class CreateAssetComputerSchema(BaseModel):
    assigned_to: Optional[str] = None
    asset_no: Optional[str] = None
    client_name: Optional[str] = None
    job_po_no: Optional[str] = None

    pc_name: str

    administrator_name: Optional[str] = None
    administrator_password: Optional[str] = None

    operating_system: Optional[str] = None
    office_version: Optional[str] = None

    rockwell_software: Optional[str] = None
    other_software: Optional[str] = None
    email_id: Optional[str] = None
    email_password: Optional[str] = None

    item_description: Optional[str] = None
    year_of_mfg: Optional[int] = None
    warranty_expire: Optional[date] = None

    manufacturer_id: Optional[int] = None
    serial_no: Optional[str] = None
    system_configuration: Optional[str] = None

    supplier_id: Optional[int] = None

    order_number: Optional[str] = None
    purchase_order_number: Optional[str] = None

    purchase_date: Optional[date] = None
    configure_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = None
    asset_type: str
    
    





class AssetComputerResponseSchema(BaseModel):
    computer_detail_id: int
    asset_type: str
    assigned_to: Optional[str]
    asset_no: Optional[str]
    client_name: Optional[str]
    job_po_no: Optional[str]
    pc_name: str
    administrator_name: Optional[str]
    administrator_password: Optional[str]
    operating_system: Optional[str]
    office_version: Optional[str]
    rockwell_software: Optional[str]
    other_software: Optional[str]
    item_description: Optional[str]
    year_of_mfg: Optional[int]
    email_id: Optional[str]
    email_password: Optional[str]
    warranty_expire: Optional[date]
    manufacturer_id: Optional[int]
    serial_no: Optional[str]
    system_configuration: Optional[str]
    supplier_id: Optional[int]
    order_number: Optional[str]
    purchase_order_number: Optional[str]
    purchase_date: Optional[date]
    configure_date: Optional[date]
    purchase_cost: Optional[Decimal]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateAssetComputerSchema(BaseModel):
    asset_type: Optional[str] = None
    assigned_to: Optional[str] = None
    asset_no: Optional[str] = None
    client_name: Optional[str] = None
    job_po_no: Optional[str] = None
    pc_name: Optional[str] = None

    administrator_name: Optional[str] = None
    administrator_password: Optional[str] = None

    operating_system: Optional[str] = None
    office_version: Optional[str] = None

    rockwell_software: Optional[str] = None
    other_software: Optional[str] = None

    item_description: Optional[str] = None
    year_of_mfg: Optional[int] = None
    warranty_expire: Optional[date] = None

    manufacturer_id: Optional[int] = None
    serial_no: Optional[str] = None
    system_configuration: Optional[str] = None

    supplier_id: Optional[int] = None
    email_id: Optional[str] = None
    email_password: Optional[str] = None

    order_number: Optional[str] = None
    purchase_order_number: Optional[str] = None

    purchase_date: Optional[date] = None
    configure_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = None




class BulkDeleteAssetSchema(BaseModel):
    ids: list[int]
    