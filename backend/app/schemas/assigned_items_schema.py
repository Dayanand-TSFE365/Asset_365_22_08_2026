from pydantic import BaseModel
from typing import List, Optional


# 🔹 ASSET RESPONSE
class AssignedAssetResponse(BaseModel):

    asset_id: int
    asset_tag: Optional[str]
    asset_name: Optional[str]
    image_url: Optional[str]
    serial_number: Optional[str]

    class Config:
        from_attributes = True


# 🔹 ACCESSORY RESPONSE
class AssignedAccessoryResponse(BaseModel):

    accessory_id: int
    accessory_name: Optional[str]
    quantity: Optional[int]

    class Config:
        from_attributes = True


# 🔹 COMPONENT RESPONSE
class AssignedComponentResponse(BaseModel):

    component_id: int
    component_name: Optional[str]
    quantity: Optional[int]

    class Config:
        from_attributes = True


# 🔹 CONSUMABLE RESPONSE
class AssignedConsumableResponse(BaseModel):

    consumable_id: int
    consumable_name: Optional[str]
    quantity: Optional[int]

    class Config:
        from_attributes = True


# 🔹 LICENSE RESPONSE
class AssignedLicenseResponse(BaseModel):

    license_id: int
    license_name: Optional[str]

    class Config:
        from_attributes = True


# 🔹 FINAL RESPONSE
class MyAssignedItemsResponse(BaseModel):

    assets: List[AssignedAssetResponse]

    accessories: List[AssignedAccessoryResponse]

    components: List[AssignedComponentResponse]

    consumables: List[AssignedConsumableResponse]

    licenses: List[AssignedLicenseResponse]