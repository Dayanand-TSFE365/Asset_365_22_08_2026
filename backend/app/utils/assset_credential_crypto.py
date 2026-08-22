from cryptography.fernet import (
    Fernet,
    InvalidToken
)

from app.core.config import settings


cipher = Fernet(
    settings.ASSET_ADMIN_PASSWORD_SECRET_KEY.encode()
)


def encrypt_password(
    password: str 
):
    if not password:
        return None

    return cipher.encrypt(
        password.encode()
    ).decode()


def decrypt_password(
    encrypted_password: str
):
    if not encrypted_password:
        return None

    try:
        return cipher.decrypt(
            encrypted_password.encode()
        ).decode()

    except InvalidToken:
        # old plain-text data
        return encrypted_password


def mask_password(
    password: str
):
    if not password:
        return ""

    if len(password) <= 4:
        return "*" * len(password)

    return "*" * (len(password) - 4) + password[-4:]