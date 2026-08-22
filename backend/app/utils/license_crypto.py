# app/utils/license_crypto.py

from cryptography.fernet import Fernet
from app.core.config import settings
from cryptography.fernet import InvalidToken
cipher = Fernet(settings.LICENSE_PRODUCT_SECRET_KEY.encode())



def encrypt_key(product_key: str):
    if not product_key:
        return None

    return cipher.encrypt(
        product_key.encode()
    ).decode()




def decrypt_key(encrypted_key: str):
    if not encrypted_key:
        return None

    try:
        return cipher.decrypt(
            encrypted_key.encode()
        ).decode()

    except InvalidToken:
        # old plain-text data
        return encrypted_key


def mask_key(product_key: str):
    if not product_key:
        return ""

    if len(product_key) <= 4:
        return "*" * len(product_key)

    return "*" * (len(product_key) - 4) + product_key[-4:]