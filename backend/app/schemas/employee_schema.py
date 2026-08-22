from pydantic import (
    BaseModel,
    EmailStr
)

from datetime import datetime

from typing import Optional


# =====================================================
# CREATE EMPLOYEE
# =====================================================

class EmployeeCreate(BaseModel):

    first_name: str

    last_name: str

    email: EmailStr

    employee_code: str

    department: Optional[str] = None

    designation: Optional[str] = None

    phone: Optional[str] = None

    login_enabled: bool = False

    password: Optional[str] = None

    confirm_password: Optional[str] = None


# =====================================================
# SINGLE EMPLOYEE RESPONSE
# =====================================================

class EmployeeResponse(BaseModel):

    # ---------------------------------
    # AUTH USER
    # ---------------------------------

    user_id: int

    email: str

    role: Optional[str] = None

    is_active: bool

    is_verified: bool

    is_approved: Optional[bool] = None

    # ---------------------------------
    # EMPLOYEE
    # ---------------------------------

    employee_id: Optional[int] = None

    employee_code: Optional[str] = None

    full_name: Optional[str] = None

    phone: Optional[str] = None

    department: Optional[str] = None

    designation: Optional[str] = None

    status: Optional[str] = None

    # ---------------------------------
    # EXTRA
    # ---------------------------------

    login_enabled: Optional[bool] = None

    created_at: Optional[datetime] = None

    class Config:

        from_attributes = True


# =====================================================
# LIST RESPONSE
# =====================================================

class EmployeeListResponse(BaseModel):

    # ---------------------------------
    # AUTH USER
    # ---------------------------------

    user_id: int

    email: str

    role: Optional[str] = None

    is_active: bool

    is_verified: bool

    is_approved: Optional[bool] = None

    # ---------------------------------
    # EMPLOYEE
    # ---------------------------------

    employee_id: Optional[int] = None

    employee_code: Optional[str] = None

    full_name: Optional[str] = None

    phone: Optional[str] = None

    department: Optional[str] = None

    designation: Optional[str] = None

    status: Optional[str] = None

    # ---------------------------------
    # EXTRA
    # ---------------------------------

    login_enabled: Optional[bool] = None

    created_at: Optional[datetime] = None

    class Config:

        from_attributes = True


# =====================================================
# UPDATE EMPLOYEE
# =====================================================

class EmployeeUpdate(BaseModel):

    first_name: Optional[str] = None

    last_name: Optional[str] = None

    email: Optional[EmailStr] = None

    employee_code: Optional[str] = None

    department: Optional[str] = None

    designation: Optional[str] = None

    phone: Optional[str] = None

    status: Optional[str] = None

    password: Optional[str] = None

    confirm_password: Optional[str] = None

    login_enabled: Optional[bool] = None