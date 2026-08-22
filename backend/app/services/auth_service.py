import hashlib
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

ACCESS_EXPIRE = 15
REFRESH_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#  normalize password (removes bcrypt length limit)
def _normalize_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def hash_password(password):
    print("🔐 Using normalized hash")   # temporary debug
    normalized = _normalize_password(password)
    return pwd_context.hash(normalized)

def verify_password(plain, hashed):
    normalized = _normalize_password(plain)
    return pwd_context.verify(normalized, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRE)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token():
    from uuid import uuid4
    return str(uuid4())