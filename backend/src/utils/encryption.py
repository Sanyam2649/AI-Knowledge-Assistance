"""
Encryption utility for API keys and sensitive configuration data.
Uses Fernet symmetric encryption from the cryptography library.
"""
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from config import API_KEY_SECRET


def _get_encryption_key() -> bytes:
    """
    Derive a Fernet key from the API_KEY_SECRET.
    Uses PBKDF2 to derive a key from the secret.
    """
    # Use API_KEY_SECRET as the password
    password = API_KEY_SECRET.encode()
    salt = b'knowledge_assistant_salt_2024'  # Fixed salt for consistency
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password))
    return key


def encrypt_value(value: str) -> str:
    """
    Encrypt a string value using Fernet.
    
    Args:
        value: The plaintext string to encrypt
        
    Returns:
        Encrypted string (base64 encoded)
    """
    if not value:
        return value
    
    try:
        key = _get_encryption_key()
        fernet = Fernet(key)
        encrypted = fernet.encrypt(value.encode())
        return encrypted.decode()
    except Exception as e:
        print(f"Error encrypting value: {e}")
        raise


def decrypt_value(encrypted_value: str) -> str:
    """
    Decrypt a string value using Fernet.
    
    Args:
        encrypted_value: The encrypted string (base64 encoded)
        
    Returns:
        Decrypted plaintext string
    """
    if not encrypted_value:
        return encrypted_value
    
    try:
        key = _get_encryption_key()
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted_value.encode())
        return decrypted.decode()
    except Exception as e:
        print(f"Error decrypting value: {e}")
        # If decryption fails, assume it's not encrypted (backward compatibility)
        return encrypted_value

