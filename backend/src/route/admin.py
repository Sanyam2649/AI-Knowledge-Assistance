from bson import ObjectId
from flask import Blueprint, jsonify, request
from datetime import datetime
from configuration.Database import (
    chat_sessions_collection,
    documents_collection,
    users_collection,
    api_config_collection,
)
from core.user_auth import jwt_required, require_role
from models.api_config import api_config_schema
from utils.encryption import encrypt_value, decrypt_value


admin_bp = Blueprint("admin", __name__)
@admin_bp.route("/admin/users", methods=["GET"])
@jwt_required
@require_role("admin")
def admin_list_users(user_id, **kwargs):
    """
    List all users with their details.
    Query params: page, limit, search (email/name search)
    """
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))
        search = request.args.get("search", "").strip().lower()
        
        skip = (page - 1) * limit
        
        # Build query for search
        query = {"role": {"$ne": "admin"}}
        if search:
            query = {
                "$or": [
                    {"email": {"$regex": search, "$options": "i"}},
                    {"firstName": {"$regex": search, "$options": "i"}},
                    {"lastName": {"$regex": search, "$options": "i"}},
                ]
            }
        
        total = users_collection.count_documents(query)
        
        users = users_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        user_list = []
        for user in users:
            # Get chat statistics for this user
            chat_count = chat_sessions_collection.count_documents({"userId": str(user["_id"])})
            
            user_list.append({
                "_id": str(user["_id"]),
                "firstName": user.get("firstName"),
                "lastName": user.get("lastName"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "role": user.get("role", "user"),
                "is_active": user.get("is_active", True),
                "created_at": user.get("created_at"),
                "chat_limit": user.get("chat_limit"),
                "usage_time_window": user.get("usage_time_window"),
                "usage_start_time": user.get("usage_start_time"),
                "usage_end_time": user.get("usage_end_time"),
                "total_chat_sessions": chat_count,
            })
        
        return jsonify({
            "success": True,
            "users": user_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/admin/users/<target_user_id>", methods=["DELETE"])
@jwt_required
@require_role("admin")
def admin_delete_user(target_user_id, **kwargs):
    """
    Delete a user and optionally their associated data.
    """
    try:
        body = request.get_json(silent=True) or {}
        delete_chats = body.get("delete_chats", False)
        delete_documents = body.get("delete_documents", False)
        # Check if user exists
        user = users_collection.find_one({"_id": ObjectId(target_user_id)})
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        if str(user["_id"]) == kwargs.get("user_id"):
            return jsonify({"success": False, "error": "Cannot delete your own account"}), 400
        
        if user.get("role", "user").lower() == "admin":
            return jsonify({"success": False, "error": "Cannot delete admin users"}), 403
        
        if delete_chats:
            chat_sessions_collection.delete_many({"userId": target_user_id})
        
        if delete_documents:
            documents_collection.delete_many({"user_id": target_user_id})
        
        # Delete the user
        result = users_collection.delete_one({"_id": ObjectId(target_user_id)})
        
        if result.deleted_count == 0:
            return jsonify({"success": False, "error": "Failed to delete user"}), 500
        
        return jsonify({
            "success": True,
            "message": "User deleted successfully",
            "userId": target_user_id,
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/admin/users/<target_user_id>/toggle", methods=["POST"])
@jwt_required
@require_role("admin")
def admin_toggle_user(target_user_id, **kwargs):
    try:
        body = request.get_json(silent=True) or {}
        is_active = body.get("is_active")
        user = users_collection.find_one({"_id": ObjectId(target_user_id)})
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        if is_active is None:
            current = user.get("is_active", True)
            is_active = not current

        if str(user["_id"]) == kwargs.get("user_id") and not is_active:
            return jsonify({
                "success": False,
                "error": "Cannot deactivate your own account"
            }), 400

        result = users_collection.update_one(
            {"_id": ObjectId(target_user_id)},
            {"$set": {
                "is_active": bool(is_active),
                "updated_at": datetime.utcnow()
            }}
        )

        if result.matched_count == 0:
            return jsonify({"success": False, "error": "User not found"}), 404

        return jsonify({
            "success": True,
            "userId": target_user_id,
            "is_active": bool(is_active),
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/admin/users/<target_user_id>/chat-limits", methods=["PUT"])
@jwt_required
@require_role("admin")
def admin_set_chat_limits(target_user_id, **kwargs):
    try:
        body = request.get_json(silent=True) or {}
        
        # Check if user exists
        user = users_collection.find_one({"_id": ObjectId(target_user_id)})
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        update_data = {"updated_at": datetime.utcnow()}
        
        # Chat limit
        if "chat_limit" in body:
            chat_limit = body["chat_limit"]
            if chat_limit is not None and (not isinstance(chat_limit, int) or chat_limit < 0):
                return jsonify({"success": False, "error": "chat_limit must be a non-negative integer or null"}), 400
            update_data["chat_limit"] = chat_limit
        
        # Usage time window
        if "usage_time_window" in body:
            window = body["usage_time_window"]
            valid_windows = ["daily", "weekly", "monthly", "custom", None]
            if window not in valid_windows:
                return jsonify({"success": False, "error": f"usage_time_window must be one of: {valid_windows}"}), 400
            update_data["usage_time_window"] = window
        result = users_collection.update_one(
            {"_id": ObjectId(target_user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        # Get updated user
        updated_user = users_collection.find_one({"_id": ObjectId(target_user_id)})
        
        return jsonify({
            "success": True,
            "userId": target_user_id,
            "chat_limit": updated_user.get("chat_limit"),
            "usage_time_window": updated_user.get("usage_time_window"),
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500



@admin_bp.route("/admin/api-config", methods=["GET"])
@jwt_required
@require_role("admin")
def admin_list_api_config(user_id, **kwargs):

    try:
        configs = api_config_collection.find({}).sort("key_name", 1)
        
        config_list = []
        for config in configs:
            key_value = config.get("key_value", "")
            decrypted_value = decrypt_value(key_value) if key_value else ""
            masked_value = ""
            if decrypted_value and len(decrypted_value) > 8:
                masked_value = decrypted_value[:4] + "*" * (len(decrypted_value) - 8) + decrypted_value[-4:]
            elif decrypted_value:
                masked_value = "*" * len(decrypted_value)
            
            config_list.append({
                "_id": str(config["_id"]),
                "key_name": config.get("key_name"),
                "key_value": masked_value,  # Show masked value
                "key_value_encrypted": True,  # Indicate it's encrypted
                "is_active": config.get("is_active", True),
                "created_at": config.get("created_at"),
                "updated_at": config.get("updated_at"),
                "created_by": config.get("created_by"),
            })
        
        return jsonify({
            "success": True,
            "configs": config_list,
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/admin/api-config", methods=["POST"])
@jwt_required
@require_role("admin")
def admin_create_api_config(user_id, **kwargs):
    try:
        body = request.get_json(silent=True) or {}
        
        required_fields = ["key_name", "key_value"]
        missing = [f for f in required_fields if f not in body or not body[f]]
        if missing:
            return jsonify({"success": False, "error": f"Missing required fields: {', '.join(missing)}"}), 400
        
        # Check if key already exists
        existing = api_config_collection.find_one({"key_name": body["key_name"]})
        if existing:
            return jsonify({"success": False, "error": f"API key '{body['key_name']}' already exists"}), 400
        
        # Create config
        config_data = api_config_schema({
            "key_name": body["key_name"],
            "key_value": body["key_value"],
            "is_active": body.get("is_active", True),
            "created_by": user_id,
        })
        
        result = api_config_collection.insert_one(config_data)
        config_data["_id"] = str(result.inserted_id)
        config_data.pop("created_by")
        
        return jsonify({
            "success": True,
            "config": config_data,
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/admin/api-config/<config_id>", methods=["PUT"])
@jwt_required
@require_role("admin")
def admin_update_api_config(user_id, config_id, **kwargs):
    try:
        body = request.get_json(silent=True) or {}
        
        # Check if config exists
        config = api_config_collection.find_one({"_id": ObjectId(config_id)})
        if not config:
            return jsonify({"success": False, "error": "API configuration not found"}), 404
        
        update_data = {"updated_at": datetime.utcnow()}
        
        if "key_value" in body:
            # Encrypt the new key value before storing
            new_key_value = body["key_value"]
            if new_key_value:
                try:
                    encrypted_value = encrypt_value(new_key_value)
                    update_data["key_value"] = encrypted_value
                except Exception as e:
                    return jsonify({"success": False, "error": f"Failed to encrypt key value: {str(e)}"}), 500
            else:
                update_data["key_value"] = ""
        
        if "description" in body:
            update_data["description"] = body["description"]
        
        if "is_active" in body:
            update_data["is_active"] = bool(body["is_active"])
        
        # Update config
        result = api_config_collection.update_one(
            {"_id": ObjectId(config_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "API configuration not found"}), 404
        
        # Get updated config
        updated_config = api_config_collection.find_one({"_id": ObjectId(config_id)})
        
        return jsonify({
            "success": True,
            "config": {
                "_id": str(updated_config["_id"]),
                "key_name": updated_config.get("key_name"),
                "key_value": updated_config.get("key_value"),
                "description": updated_config.get("description"),
                "is_active": updated_config.get("is_active", True),
                "updated_at": updated_config.get("updated_at"),
            },
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/admin/api-config/<config_id>", methods=["DELETE"])
@jwt_required
@require_role("admin")
def admin_delete_api_config(user_id, config_id, **kwargs):
    try:
        result = api_config_collection.delete_one({"_id": ObjectId(config_id)})
        
        if result.deleted_count == 0:
            return jsonify({"success": False, "error": "API configuration not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "API configuration deleted successfully",
            "configId": config_id,
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/admin/api-config/<config_id>/toggle", methods=["POST"])
@jwt_required
@require_role("admin")
def admin_toggle_api_config(user_id, config_id, **kwargs):
    try:
        body = request.get_json(silent=True) or {}
        is_active = body.get("is_active")
        
        if is_active is None:
            return jsonify({"success": False, "error": "is_active is required"}), 400
        
        result = api_config_collection.update_one(
            {"_id": ObjectId(config_id)},
            {"$set": {"is_active": bool(is_active), "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "API configuration not found"}), 404
        
        return jsonify({
            "success": True,
            "configId": config_id,
            "is_active": bool(is_active),
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
