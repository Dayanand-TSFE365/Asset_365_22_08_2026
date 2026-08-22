import os
import secrets
from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from fastapi import HTTPException
import re


# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing config
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -------------------------
# Password Hashing
# -------------------------

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# -------------------------
# JWT Token Creation
# -------------------------

# def create_access_token(data: dict):
#     to_encode = data.copy()

#     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

#     to_encode.update({"exp": expire})

#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

#     return encoded_jwt


def create_access_token(data: dict, expires_delta: timedelta | None = None):

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


# -------------------------
# Decode JWT Token
# -------------------------

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# -------------------------
# Refresh Token Generator
# -------------------------

def create_refresh_token():
    return secrets.token_hex(32)



def verify_token(token: str):

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    



def validate_password(password: str):

    pattern = r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"

    if not re.match(pattern, password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters and include a letter, number, and special character"
        )



# from fastapi import Depends, HTTPException, status
# from fastapi.security import HTTPBasic, HTTPBasicCredentials
# import secrets

# from app.core.config import settings

# security = HTTPBasic()

# def get_current_user_basic(credentials: HTTPBasicCredentials = Depends(security)):
#     correct_username = secrets.compare_digest(
#         credentials.username, settings.DOCS_USERNAME
#     )
#     correct_password = secrets.compare_digest(
#         credentials.password, settings.DOCS_PASSWORD
#     )

#     if not (correct_username and correct_password):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid credentials",
#             headers={"WWW-Authenticate": "Basic"},
#         )

#     return credentials.username