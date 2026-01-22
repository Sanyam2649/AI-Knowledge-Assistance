from datetime import datetime
from bson import ObjectId

def document_schema(data):
    user_id = data["user_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    return {
        "user_id": user_id,
        "title": data["title"],
        "file_name": data["file_name"],
        "file_type": data["file_type"],
        "status": "processed",
        "created_at": datetime.utcnow(),
        "is_enabled": data.get("is_enabled", True)
    }
