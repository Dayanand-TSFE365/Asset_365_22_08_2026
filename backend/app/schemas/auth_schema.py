from pydantic import BaseModel, EmailStr,Field, validator
from typing import Optional
from datetime import datetime

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    contact_number:str = Field(..., min_length=10, max_length=10)
    company_name: str
    
    @validator("contact_number")
    def validate_phone(cls, value):
        if not value.isdigit():
            raise ValueError("Contact number must contain only digits")

        if len(value) != 10:
            raise ValueError("Contact number must be exactly 10 digits")

        return value

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    permissions: list[str]
  
    
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    
    
class VerifyOTP(BaseModel):
    email: str
    otp: str
    
    

class ResetPasswordRequest_For_OTP(BaseModel):
    email: str
    new_password: str
    confirm_password: str
    

class ApproveUserRequest(BaseModel):

    user_id: int

    access_type: str

    access_expires_at: Optional[datetime] = None


class AccessExtensionRequest(BaseModel):
    email: EmailStr
    password: str

class ExtendAccessRequest(BaseModel):
    user_id: int
    access_expires_at: datetime