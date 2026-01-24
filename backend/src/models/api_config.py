from datetime import datetime
from utils.encryption import encrypt_value


def api_config_schema(data):
    """
    Schema for API configuration stored in database.
    Automatically encrypts key_value before storing.
    """
    key_value = data.get("key_value", "")
    # Encrypt the key value if it's provided and not already encrypted
    encrypted_value = key_value
    if key_value:
        try:
            # Try to encrypt (will handle if already encrypted)
            encrypted_value = encrypt_value(key_value)
        except Exception as e:
            print(f"Warning: Failed to encrypt key_value: {e}")
            # If encryption fails, store as-is (for backward compatibility)
            encrypted_value = key_value
    
    return {
        "key_name": data["key_name"],  # e.g., "GEMINI_API_KEY", "PINECONE_API_KEY"
        "key_value": encrypted_value,  # Encrypted API key value
        "is_active": data.get("is_active", True),
        "created_at": data.get("created_at", datetime.utcnow()),
        "updated_at": datetime.utcnow(),
        "created_by": data.get("created_by"),  # Admin user ID who created/updated
    }

