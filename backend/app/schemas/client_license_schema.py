from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal

class CreateClientLicenseSchema(BaseModel):
    license_type_id: int

    job_po_no: Optional[str] = None
    client_name: Optional[str] = None

    product_name: Optional[str] = None
    description: Optional[str] = None

    serial_number: Optional[str] = None
    product_key: Optional[str] = None

    email_id: Optional[str] = None
    password: Optional[str] = None

    note_1: Optional[str] = None
    note_2: Optional[str] = None

    remarks: Optional[str] = None

    expired_on: Optional[date] = None

    supplier_id: Optional[int] = None

    order_number: Optional[str] = None
    purchase_order_number: Optional[str] = None

    customer_po: Optional[str] = None
    contract: Optional[str] = None

    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = None


class LicenseTypeResponseSchema(BaseModel):
    license_type_id: int
    name: str

    class Config:
        from_attributes = True


class UpdateClientLicenseSchema(BaseModel):
    license_type_id: Optional[int] = None
    job_po_no: Optional[str] = None
    client_name: Optional[str] = None

    product_name: Optional[str] = None
    description: Optional[str] = None

    serial_number: Optional[str] = None
    product_key: Optional[str] = None

    email_id: Optional[str] = None
    password: Optional[str] = None

    note_1: Optional[str] = None
    note_2: Optional[str] = None

    remarks: Optional[str] = None

    expired_on: Optional[date] = None

    supplier_id: Optional[int] = None

    order_number: Optional[str] = None
    purchase_order_number: Optional[str] = None

    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = None

    customer_po: Optional[str]
    contract: Optional[str]


class BulkDeleteLicenseSchema(BaseModel):
    ids: list[int]