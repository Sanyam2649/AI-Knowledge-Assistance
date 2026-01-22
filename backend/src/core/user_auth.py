import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from config import API_KEY_SECRET, JWT_EXP_DELTA_SECONDS, JWT_ALGORITHM
from configuration.Database import users_collection
from bson import ObjectId

JWT_SECRET = API_KEY_SECRET
JWT_ALGORITHM = JWT_ALGORITHM
JWT_EXP_DELTA_SECONDS = JWT_EXP_DELTA_SECONDS

def generate_jwt(user_id, email):
    payload = {
        "user_id": str(user_id),
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXP_DELTA_SECONDS)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

def decode_jwt(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"success": False, "error": "Missing Authorization header"}), 401

        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({"success": False, "error": "Invalid Authorization header"}), 401

        payload = decode_jwt(token)
        if not payload:
            return jsonify({"success": False, "error": "Invalid or expired token"}), 401

        # Pass user info to route
        kwargs["user_id"] = payload["user_id"]
        kwargs["email"] = payload["email"]
        return f(*args, **kwargs)
    return decorated_function


def require_role(*allowed_roles):
    """
    Decorator to enforce role-based access on top of jwt_required.
    Usage:
        @jwt_required
        @require_role("admin")
        def endpoint(user_id, email): ...
    """
    allowed = {r.lower() for r in allowed_roles}

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user_id = kwargs.get("user_id")
            if not user_id:
                return jsonify({"success": False, "error": "Missing user context"}), 401

            user = users_collection.find_one({"_id": ObjectId(user_id)})
            if not user or not user.get("is_active", True):
                return jsonify({"success": False, "error": "User not found or inactive"}), 401

            role = (user.get("role") or "user").lower()
            if role not in allowed:
                return jsonify({"success": False, "error": "Forbidden"}), 403

            kwargs["role"] = role
            return f(*args, **kwargs)

        return decorated

    return decorator
