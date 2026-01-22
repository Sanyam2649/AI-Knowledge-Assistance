from datetime import datetime


def user_schema(data):
    return {
        "firstName": data["firstName"],
        "lastName": data["lastName"],
        "email": data["email"].lower(),
        "phone": data["phone"],
        "role": (data.get("role") or "user").lower(),
        "password_hash": data["password_hash"],
        "created_at": datetime.utcnow(),
        "is_active": True
    }
