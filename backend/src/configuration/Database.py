from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

db = client.get_default_database()

users_collection = db.users
chat_sessions_collection = db.chat_sessions
documents_collection = db.documents
document_chunks_collection = db.document_chunks
messages_collection = db.messages
api_config_collection = db.api_config

def connect_to_database():
    """
    Optional helper if you want to ensure connection is alive.
    With global client, this is usually unnecessary.
    """
    try:
        client.admin.command("ping")
        return True
    except Exception as e:
        print("MongoDB connection failed:", e)
        return False
