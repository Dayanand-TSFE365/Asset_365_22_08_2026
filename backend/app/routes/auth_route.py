from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from zoneinfo import ZoneInfo

from app.core.security import verify_token
from app.schemas.auth_schema import ResetPasswordRequest
from app.db.database import get_asset_db
from app.models import auth_model
from app.core.security import hash_password, verify_password, create_access_token,create_refresh_token
from app.schemas.auth_schema import SignupRequest, LoginRequest, TokenResponse,ApproveUserRequest,ExtendAccessRequest
from app.core.dependencies import get_current_user
import secrets
from app.models.employee_model import Employee
from app.core.otp_utils import generate_otp
from app.schemas.auth_schema import VerifyOTP

from datetime import timedelta
from app.core.security import create_access_token
from app.services.email.auth_email_service import (
    send_reset_email,
    send_reset_email,
    send_verification_email,
    send_admin_notification,
    send_approval_email,
    send_access_extension_request_email,
    send_access_extension_approved_email
)

from datetime import timedelta
from app.core.security import create_access_token

from app.core.security import validate_password

from app.repository.permission_repository import (
    get_user_permissions_repo
)

from app.schemas.auth_schema import ResetPasswordRequest_For_OTP,AccessExtensionRequest

IST = ZoneInfo("Asia/Kolkata")


router = APIRouter(prefix="/apiV3/auth", tags=["Auth"])

# api-health test route
@router.get("/")
def health():
    return {"message": "Your Authentication API working fine"}

# signup route



@router.post("/signup")
async def signup(user: SignupRequest, db: Session = Depends(get_asset_db)):

    existing_user = db.query(auth_model.AuthUser).filter(auth_model.AuthUser.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    validate_password(user.password)

    verification_token = secrets.token_urlsafe(32)

    new_user = auth_model.AuthUser(
        email=user.email,
        password_hash=hash_password(user.password),
        contact_number=user.contact_number,
        company_name=user.company_name,
        role="user",
        is_active=True,
        failed_attempts=0,
        verification_token=verification_token,
        is_verified=False,
        is_approved=False,   #  IMPORTANT

        access_type=None,
        access_expires_at=None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    #  Send to USER
    await send_verification_email(user.email, verification_token)

    # #  Send to ADMIN
    # await send_admin_notification(user.email)

    return {"message": "User created. Please verify your email."}






# login route

@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_asset_db)
):

    # ----------------------------------------
    # 1. FIND USER
    # ----------------------------------------

    user = db.query(auth_model.AuthUser).filter(
        auth_model.AuthUser.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    
    # ----------------------------------------
    # 2. CHECK PASSWORD
    # ----------------------------------------

    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    # ----------------------------------------
    # 3. CHECK EMAIL VERIFICATION
    # ----------------------------------------

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="EMAIL_NOT_VERIFIED"
        )

    # # ----------------------------------------
    # # 3. CHECK ACCOUNT ACTIVE
    # # ----------------------------------------

    # if not user.is_active:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Your account is inactive."
    #     )

    

    # ----------------------------------------
    # 5. CHECK ADMIN APPROVAL
    # ----------------------------------------

    if not user.is_approved:
        raise HTTPException(
            status_code=403,
            detail="WAITING_FOR_ADMIN_APPROVAL"
        )


  

    # ----------------------------------------
    # 6. CHECK TEMPORARY ACCESS
    # ----------------------------------------
    # 5. CHECK TEMPORARY ACCESS EXPIRY
    # ----------------------------------------

    if user.access_type == "TEMPORARY":

        if not user.access_expires_at:
            raise HTTPException(
                status_code=403,
                detail="TEMPORARY_EXPIRY_NOT_CONFIGURED"
            )

        current_time = datetime.now(IST).replace(tzinfo=None)

        if current_time >= user.access_expires_at:

            # User was already approved.
            # Only disable current access.
            user.is_active = False

            db.commit()

            raise HTTPException(
                status_code=403,
                detail="TEMPORARY_ACCESS_EXPIRED"
            )


    # ----------------------------------------
    # 6. CHECK ACCOUNT ACTIVE
    # ----------------------------------------

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_INACTIVE"
        )

    # ----------------------------------------
    # 7. GET PERMISSIONS
    # ----------------------------------------

    permissions = get_user_permissions_repo(
        db,
        user.id
    )

    # ----------------------------------------
    # 8. CREATE ACCESS TOKEN
    # ----------------------------------------

    access_token = create_access_token({

        "sub": user.email,

        "role": user.role,

        "user_id": user.id,

        "permissions": permissions
    })

    # ----------------------------------------
    # 9. CREATE REFRESH TOKEN
    # ----------------------------------------

    refresh_token = create_refresh_token()

    db_token = auth_model.RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        is_revoked=False
    )

    db.add(db_token)
    db.commit()

    # ----------------------------------------
    # 10. RESPONSE
    # ----------------------------------------

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        permissions=permissions
    )
    
    
    
#  refresh token 

@router.post("/refresh")
def refresh_token(token: str, db: Session = Depends(get_asset_db)):

    db_token = db.query(auth_model.RefreshToken).filter(
        auth_model.RefreshToken.token == token,
        auth_model.RefreshToken.is_revoked == False
    ).first()

    if not db_token or db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(auth_model.AuthUser).filter(auth_model.AuthUser.id == db_token.user_id).first()

    access_token = create_access_token({"sub": user.email, "role": user.role})

    return {"access_token": access_token}



# logout 

@router.post("/logout")
def logout(token: str, db: Session = Depends(get_asset_db)):

    db_token = db.query(auth_model.RefreshToken).filter(auth_model.RefreshToken.token == token).first()

    if db_token:
        db_token.is_revoked = True
        db.commit()

    return {"message": "Logged out"}



# @router.get("/admin")
# def admin_route(user=Depends(get_current_user)):
#     if user["role"] != "admin":
#         raise HTTPException(status_code=403, detail="Forbidden")

#     return {"message": "Welcome Admin"}

@router.get("/admin")
def admin_route(user: auth_model.AuthUser = Depends(get_current_user)):
    
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    return {"message": "Welcome Admin"}




@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_asset_db)):

    user = db.query(auth_model.AuthUser).filter(
        auth_model.AuthUser.verification_token == token
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    user.is_verified = True
    user.verification_token = None

    #  generate approval token
    approval_token = secrets.token_urlsafe(32)
    user.approval_token = approval_token

    db.commit()

    # send admin mail with token
    await send_admin_notification(user.email, approval_token)

    return {"message": "Email verified. Waiting for admin approval."}


# UPDATE AuthUsers
# SET role = 'admin'
# WHERE email = 'admin@test.com';


@router.post("/forgot-password")

async def forgot_password(email: str, db: Session = Depends(get_asset_db)):

    user = db.query(auth_model.AuthUser).filter(auth_model.AuthUser.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = generate_otp()

    user.reset_otp = otp
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=5)

    db.commit()

    await send_reset_email(user.email, otp)

    return {"message": "OTP sent to your email"}


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_asset_db)
):

    payload = verify_token(data.token)

    email = payload.get("email")

    user = db.query(auth_model.AuthUser).filter(auth_model.AuthUser.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(data.new_password)

    db.commit()

    return {"message": "Password reset successful"}



@router.post("/verify-otp")

def verify_otp(data: VerifyOTP, db: Session = Depends(get_asset_db)):

    user = db.query(auth_model.AuthUser).filter(auth_model.AuthUser.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.reset_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.otp_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    return {"message": "OTP verified"}

@router.post("/reset-password_otp")
def reset_password(data: ResetPasswordRequest_For_OTP, db: Session = Depends(get_asset_db)):

    user = db.query(auth_model.AuthUser).filter(auth_model.AuthUser.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # check password match
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # check new password is not same as old password
    if verify_password(data.new_password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="New password cannot be same as old password"
        )

    # update password
    user.password_hash = hash_password(data.new_password)

    # clear otp
    user.reset_otp = None
    user.otp_expiry = None

    db.commit()

    return {"message": "Password reset successful"}


# @router.get("/approve-user")
# def approve_user(token: str, db: Session = Depends(get_asset_db)):

#     user = db.query(auth_model.AuthUser).filter(
#         auth_model.AuthUser.approval_token == token
#     ).first()

#     if not user:
#         raise HTTPException(status_code=400, detail="Invalid approval token")

#     user.is_approved = True
#     user.approval_token = None  #  clear token after use

#     db.commit()

#     return {"message": f"{user.email} approved successfully"}

# @router.post("/approve-user")
# def approve_user(
#     data: ApproveUserRequest,
#     db: Session = Depends(get_asset_db),
#     current_user= Depends(get_current_user)
# ):


#     if current_user.role.lower() not in [
#             "admin",
#             "superadmin"
#         ]:
#             raise HTTPException(
#                 status_code=403,
#                 detail="Only admin can approve users."
#             )
    
#     user = db.query(
#         auth_model.AuthUser
#     ).filter(
#         auth_model.AuthUser.approval_token == data.approval_token
#     ).first()

#     if not user:
#         raise HTTPException(
#             status_code=400,
#             detail="Invalid approval token"
#         )

#     if not user.is_verified:
#         raise HTTPException(
#             status_code=400,
#             detail="User email is not verified"
#         )

#     if data.access_type == "TEMPORARY":

#         if not data.access_expires_at:
#             raise HTTPException(
#                 status_code=400,
#                 detail="Expiration time is required for temporary access."
#             )

#         if data.access_expires_at <= datetime.utcnow():
#             raise HTTPException(
#                 status_code=400,
#                 detail="Expiration time must be in the future."
#             )

#         user.access_type = "TEMPORARY"
#         user.access_expires_at = data.access_expires_at

#     else:

#         user.access_type = "PERMANENT"
#         user.access_expires_at = None

#     user.is_approved = True
#     user.is_active = True
#     user.approval_token = None

#     db.commit()

#     return {
#         "message": f"{user.email} approved successfully",
#         "access_type": user.access_type,
#         "access_expires_at": user.access_expires_at
#     }




@router.post("/admin/approve-user")
async def approve_user(
    data: ApproveUserRequest,
    db: Session = Depends(get_asset_db),
    current_user: auth_model.AuthUser = Depends(get_current_user)
):
    
    # Only admin can approve
    if current_user.role.lower() not in [
        "admin",
        "superadmin"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Only admin can approve users."
        )
    # ==========================================
    # 2. GET AUTH USER
    # ==========================================

    user = db.query(
        auth_model.AuthUser
    ).filter(
        auth_model.AuthUser.id == data.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # ==========================================
    # 3. EMAIL MUST BE VERIFIED
    # ==========================================

    if not user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="User has not verified their email."
        )

    # ==========================================
    # 4. VALIDATE ACCESS TYPE
    # ==========================================


    if data.access_type not in [
        "PERMANENT",
        "TEMPORARY"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid access type."
        )

    # --------------------------------
    # PERMANENT
    # --------------------------------

    if data.access_type == "PERMANENT":

        user.is_approved = True
        user.is_active = True

        user.access_type = "PERMANENT"
        user.access_expires_at = None

    # --------------------------------
    # TEMPORARY
    # --------------------------------

    elif data.access_type == "TEMPORARY":

        if not data.access_expires_at:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Expiry date is required "
                    "for temporary access."
                )
            )

        if data.access_expires_at <= current_time:
            raise HTTPException(
                status_code=400,
                detail="Expiry date must be in the future."
            )

        user.is_approved = True
        user.is_active = True

        user.access_type = "TEMPORARY"
        user.access_expires_at = (
            data.access_expires_at
        )

    # ==========================================
    # 7. CREATE EMPLOYEE PROFILE
    # ==========================================
    employee = (
        db.query(Employee)
        .filter(
            Employee.auth_user_id == user.id
        )
        .first()
    )

    if not employee:

        employee = Employee(

            auth_user_id=user.id,

            # Signup doesn't currently provide
            # employee code.
            employee_code=f"EMP-{user.id}",

            # Signup doesn't currently provide
            # full name.
            full_name="",

            # IMPORTANT
            email=user.email,

            # Get phone from AuthUsers
            phone=user.contact_number,

            department=None,

            designation=None,

            # IMPORTANT
            status="Active",

            is_deleted=False
        )

        db.add(employee)

    else:
        # Safety in case Employee already exists
        employee.email = user.email
        employee.phone = user.contact_number
        employee.status = "Active"
        employee.is_deleted = False

    # ==========================================
    # 8. CLEAR OLD APPROVAL TOKEN
    # ========================================


    # Approval token is no longer needed
    user.approval_token = None

    db.commit()
    db.refresh(user)

    await send_approval_email(
        user_email=user.email,
        access_type=user.access_type,
        access_expires_at=user.access_expires_at
    )

    return {
        "message": "User approved successfully.",
        "user_id": user.id,
        "email": user.email,
        "access_type": user.access_type,
        "access_expires_at": user.access_expires_at
    }

# @router.get("/pending-users")
# def get_pending_users(db: Session = Depends(get_asset_db)):
#     users = db.query(auth_model.AuthUser).filter(
#         auth_model.AuthUser.is_verified == True,
#         auth_model.AuthUser.is_approved == False
#     ).all()

#     return [
#         {
#             "email": u.email,
#             "company_name": u.company_name,
#             "contact_number": u.contact_number
#         }
#         for u in users
#     ]

@router.get("/pending-users")
def get_pending_users(
    db: Session = Depends(get_asset_db),
    # current_user: auth_model.AuthUser = Depends(
    #     get_current_user
    # )
):

    # if current_user.role.lower() not in [
    #     "admin",
    #     "superadmin"
    # ]:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Admin access required."
    #     )

    users = db.query(
        auth_model.AuthUser
    ).filter(
        auth_model.AuthUser.is_verified == True,
        auth_model.AuthUser.is_approved == False
    ).all()

    return [
        {
        "user_id": u.id,
        "email": u.email,
        "company_name": u.company_name,
        "contact_number": u.contact_number,
    }
        for u in users
    ]



@router.get("/admin/access-extension-requests")
def get_access_extension_requests(
    db: Session = Depends(get_asset_db),
    # current_user: auth_model.AuthUser = Depends(get_current_user)
):

    # ----------------------------------------
    # ADMIN CHECK
    # ----------------------------------------

    # if current_user.role.lower() not in [
    #     "admin",
    #     "superadmin"
    # ]:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Only admin can view access requests."
    #     )

    # ----------------------------------------
    # GET PENDING REQUESTS
    # ----------------------------------------

    users = (
        db.query(auth_model.AuthUser)
        .filter(
            auth_model.AuthUser.access_extension_status
            == "PENDING"
        )
        .all()
    )

    return [
        {
            "user_id": user.id,
            "email": user.email,
            "access_type": user.access_type,
            "access_expires_at": user.access_expires_at,
            "requested_at": user.access_extension_requested_at,
            "status": user.access_extension_status
        }
        for user in users
    ]

@router.post("/request-access-extension")
async def request_access_extension(
    data: AccessExtensionRequest,
    db: Session = Depends(get_asset_db)
):

    user = (
        db.query(auth_model.AuthUser)
        .filter(
            auth_model.AuthUser.email == data.email
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # -----------------------------------------
    # VERIFY PASSWORD
    # -----------------------------------------

    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials."
        )

    # -----------------------------------------
    # ONLY TEMPORARY USERS
    # -----------------------------------------

    if user.access_type != "TEMPORARY":
        raise HTTPException(
            status_code=400,
            detail="Access extension is only available for temporary access."
        )

    # -----------------------------------------
    # CHECK EXPIRY
    # -----------------------------------------
    current_time = datetime.now(IST).replace(tzinfo=None)
    
    if not user.access_expires_at:
        raise HTTPException(
            status_code=400,
            detail="Access expiry is not configured."
        )

    if current_time < user.access_expires_at:
        raise HTTPException(
            status_code=400,
            detail="Your temporary access has not expired yet."
        )

    # -----------------------------------------
    # ALREADY REQUESTED?
    # -----------------------------------------

    if user.access_extension_requested:

        raise HTTPException(
            status_code=400,
            detail="Access extension request is already pending."
        )

    # -----------------------------------------
    # CREATE REQUEST
    # -----------------------------------------

    user.access_extension_requested = True

    user.access_extension_requested_at = current_time

    user.access_extension_status = "PENDING"

    db.commit()
    await send_access_extension_request_email(
        user_email=user.email,
        requested_at=user.access_extension_requested_at,
        current_expiry=user.access_expires_at
    )

    return {
    "message": (
        "Access extension request sent to your administrator."
    ),
    "status": "PENDING"
}

@router.post("/admin/extend-access")
async def extend_user_access(
    data: ExtendAccessRequest,
    db: Session = Depends(get_asset_db),
    current_user: auth_model.AuthUser = Depends(get_current_user)
):

    # Admin check
    if current_user.role.lower() not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin can extend access."
        )

    user = (
        db.query(auth_model.AuthUser)
        .filter(auth_model.AuthUser.id == data.user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    if user.access_type != "TEMPORARY":
        raise HTTPException(
            status_code=400,
            detail="Only temporary users can request access extension."
        )

    if not data.access_expires_at:
        raise HTTPException(
            status_code=400,
            detail="New expiry date is required."
        )

    if data.access_expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="New expiry must be in the future."
        )

    # --------------------------------
    # EXTEND ACCESS
    # --------------------------------

    user.access_expires_at = data.access_expires_at

    user.is_active = True

    user.access_extension_requested = False

    user.access_extension_requested_at = None

    user.access_extension_status = "APPROVED"

    db.commit()
    db.refresh(user)

    await send_access_extension_approved_email(
        user_email=user.email,
        access_expires_at=user.access_expires_at
    )

    return {
        "message": "Access extended successfully.",
        "user_id": user.id,
        "email": user.email,
        "access_type": user.access_type,
        "access_expires_at": user.access_expires_at,
        "access_extension_requested": user.access_extension_requested,
        "access_extension_status": user.access_extension_status
    }