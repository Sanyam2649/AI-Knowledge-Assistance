"""
Utility functions to retrieve API keys from database configuration.
Values are fetched from DB, decrypted automatically.
Database is the single source of truth.
"""

from configuration.Database import api_config_collection
from utils.encryption import decrypt_value

def get_api_key(key_name: str) -> str | None:
    """
    Get an API key from database configuration.
    Automatically decrypts the value if encrypted.

    Args:
        key_name: The name of the API key (e.g., "GEMINI_API_KEY")

    Returns:
        Decrypted API key value if found and active, else None
    """
    try:
        config = api_config_collection.find_one(
            {
                "key_name": key_name,
                "is_active": True,
            }
        )

        if config and config.get("key_value"):
            return decrypt_value(config["key_value"])

    except Exception as e:
        print(f"Warning: Failed to retrieve {key_name} from database: {e}")

    return None


def get_gemini_api_key() -> str | None:
    return get_api_key("GEMINI_API_KEY")


def get_gemini_api_url() -> str | None:
    return get_api_key("GEMINI_API_URL")


def get_pinecone_api_key() -> str | None:
    return get_api_key("PINECONE_API_KEY")


def get_pinecone_index_name() -> str | None:
    return get_api_key("PINECONE_INDEX_NAME")


def get_pinecone_chat_index_name() -> str | None:
    return get_api_key("PINECONE_CHAT_INDEX_NAME")


def get_huggingface_api_key() -> str | None:
    return get_api_key("HUGGINGFACE_API_KEY")


def get_hf_modal() -> str | None:
    return get_api_key("HF_MODAL")
