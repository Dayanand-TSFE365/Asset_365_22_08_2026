# To get user as a SQLAlchemy model instance with id, email, role
    
from fastapi import Depends, HTTPException
from jose import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_asset_db
from app.models.auth_model import AuthUser

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_asset_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email = payload.get("sub")   #  extract email

        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        #  fetch user from DB
        user = db.query(AuthUser).filter(AuthUser.email == email).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user   # NOW user.id works

    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")