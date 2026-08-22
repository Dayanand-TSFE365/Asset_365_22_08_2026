from pydantic import BaseModel
from typing import Optional
from fastapi import Form

# 🔹 PROFILE RESPONSE
class ProfileResponse(BaseModel):

    id: int

    employee_code: str

    full_name: str

    email: Optional[str]

    phone: Optional[str]

    department: Optional[str]

    designation: Optional[str]

    profile_image: Optional[str]

    status: Optional[str]

    class Config:
        from_attributes = True




class UpdateProfileSchema:

    def __init__(

        self,

        full_name: str = Form(None),
        phone: str = Form(None)

    ):

        self.full_name = full_name
        self.phone = phone

#  CHANGE PASSWORD
class ChangePasswordSchema(BaseModel):

    old_password: str

    new_password: str

    confirm_password: str