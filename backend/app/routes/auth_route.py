from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.security import verify_token
from app.schemas.auth_schema import ResetPasswordRequest
from app.db.database import get_asset_db
from app.models import auth_model
from app.core.security import hash_password, verify_password, create_access_token,create_refresh_token
from app.schemas.auth_schema import SignupRequest, LoginRequest, TokenResponse
from app.core.dependencies import get_current_user
import secrets

from app.core.otp_utils import generate_otp
from app.schemas.auth_schema import VerifyOTP

from datetime import timedelta
from app.core.security import create_access_token
from app.services.email.auth_email_service import send_reset_email,send_reset_email,send_verification_email,send_admin_notification

from datetime import timedelta
from app.core.security import create_access_token

from app.core.security import validate_password

from app.repository.permission_repository import (
    get_user_permissions_repo
)

from app.schemas.auth_schema import ResetPasswordRequest_For_OTP

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
        is_approved=False   # 👈 IMPORTANT
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
def login(data: LoginRequest, db: Session = Depends(get_asset_db)):

    user = db.query(auth_model.AuthUser).filter(auth_model.AuthUser.email == data.email).first()
    
    if not user:
        raise HTTPException(
        status_code=404,
        detail="User not found"
        )
    
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_verified:
        raise HTTPException(
        status_code=403,
        detail="Please verify your email first"
    )
        
    if not user.is_approved:
        raise HTTPException(
        status_code=403,
        detail="Waiting for admin approval"
    )

    # access_token = create_access_token({"sub": user.email, "role": user.role})
    permissions = get_user_permissions_repo(
    db,
    user.id
    )

    access_token = create_access_token({

    "sub": user.email,

    "role": user.role,
    "user_id":user.id,

    "permissions": permissions
    })

    refresh_token = create_refresh_token()

    db_token = auth_model.RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        is_revoked=False
    )

    db.add(db_token)
    db.commit()

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


@router.get("/approve-user")
def approve_user(token: str, db: Session = Depends(get_asset_db)):

    user = db.query(auth_model.AuthUser).filter(
        auth_model.AuthUser.approval_token == token
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid approval token")

    user.is_approved = True
    user.approval_token = None  # 🔥 clear token after use

    db.commit()

    return {"message": f"{user.email} approved successfully"}

@router.get("/pending-users")
def get_pending_users(db: Session = Depends(get_asset_db)):
    users = db.query(auth_model.AuthUser).filter(
        auth_model.AuthUser.is_verified == True,
        auth_model.AuthUser.is_approved == False
    ).all()

    return [
        {
            "email": u.email,
            "company_name": u.company_name,
            "contact_number": u.contact_number
        }
        for u in users
    ]