from configuration.Database import db
from models.chat_session import message_schema,chat_session_schema
from datetime import datetime

def save_message(user_id: str, session_id: str, role: str, message: str):
    """
    Save a single message into a chat session in MongoDB.
    Creates a session if it doesn't exist.
    """
    session = db.chat_sessions.find_one({"userId": user_id, "sessionId": session_id})
    new_message = message_schema({"role": role, "message": message})

    if session:
        db.chat_sessions.update_one(
            {"_id": session["_id"]},
            {
                "$push": {"messages": new_message},
                "$set": {"updatedAt": datetime.utcnow()}
            }
        )
    else:
        new_session = chat_session_schema({
            "userId": user_id,
            "sessionId": session_id,
            "messages": [new_message]
        })
        db.chat_sessions.insert_one(new_session)

    return {"success": True}

def get_chat_history(user_id: str, session_id: str):
    """
    Get all messages for a chat session, sorted by timestamp.
    """
    session = db.chat_sessions.find_one({"userId": user_id, "sessionId": session_id})

    if not session:
        return {"success": True, "userId": user_id, "sessionId": session_id, "messages": []}

    sorted_messages = sorted(session.get("messages", []), key=lambda x: x["timestamp"])
    formatted_messages = [
        {"role": msg["role"], "message": msg["message"], "timestamp": msg["timestamp"]}
        for msg in sorted_messages
    ]

    return {
        "success": True,
        "userId": session["userId"],
        "sessionId": session["sessionId"],
        "messages": formatted_messages
    }

def get_all_chat_history(user_id: str):
    """
    Get all chat sessions for a user, sorted by session creation timestamp.
    """
    chats_cursor = db.chat_sessions.find({"userId": user_id})
    chats = list(chats_cursor)

    if not chats:
        return []

    formatted_chats = []
    for chat in chats:
        sorted_messages = sorted(chat.get("messages", []), key=lambda x: x["timestamp"])
        formatted_messages = [
            {"role": msg["role"], "message": msg["message"], "timestamp": msg["timestamp"]}
            for msg in sorted_messages
        ]

        formatted_chats.append({
            "success": True,
            "userId": chat["userId"],
            "sessionId": chat["sessionId"],
            "messages": formatted_messages,
            "createdAt": chat.get("createdAt"),
            "updatedAt": chat.get("updatedAt")
        })

    formatted_chats.sort(key=lambda x: x["createdAt"], reverse=True)

    return formatted_chats

def delete_chat(user_id: str, session_id: str):
    """
    Delete an entire chat session from MongoDB.
    """
    result = db.chat_sessions.delete_one({"userId": user_id, "sessionId": session_id})
    if result.deleted_count == 0:
        return {"success": False, "message": "No session found to delete"}
    return {"success": True, "message": f"Chat session {session_id} deleted successfully"}