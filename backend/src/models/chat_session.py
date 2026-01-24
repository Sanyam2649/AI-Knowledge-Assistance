from datetime import datetime

def message_schema(data):
    return {
        "role": data["role"],
        "message": data["message"],
        "timestamp": data.get("timestamp", datetime.utcnow())
    }


def chat_session_schema(data):
    return {
        "userId": data["userId"],     
        "sessionId": data["sessionId"], 
        "messages": data.get("messages", []),
        "is_active": True,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
