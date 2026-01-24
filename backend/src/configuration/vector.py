from pinecone import Pinecone
from utils.api_config_helper import (
    get_pinecone_api_key,
    get_pinecone_index_name,
    get_pinecone_chat_index_name
)

_pinecone_api_key = get_pinecone_api_key()
_pinecone_index_name = get_pinecone_index_name()
_pinecone_chat_index_name = get_pinecone_chat_index_name()

pc = Pinecone(api_key=_pinecone_api_key) if _pinecone_api_key else None
database_index = pc.Index(_pinecone_index_name) if pc and _pinecone_index_name else None
chat_index = pc.Index(_pinecone_chat_index_name) if pc and _pinecone_chat_index_name else None
