from datetime import datetime

def user_schema(data):
    now = datetime.utcnow()
    return {
        "firstName": data["firstName"],
        "lastName": data["lastName"],
        "email": data["email"].lower(),
        "phone": data["phone"],
        "role": (data.get("role") or "user").lower(),
        "password_hash": data["password_hash"],
        "created_at": now,
        "is_active": True,
        "chat_limit": data.get("chat_limit"),              
        "usage_time_window": data.get("usage_time_window"),         
        "usage_start_time": data.get("usage_start_time"),           
        "usage_end_time": data.get("usage_end_time"),
        "chat_count": 0,   
        "chat_count_reset_at": now,
    }
