from flask import Blueprint, jsonify, request
import uuid

from core.user_auth import jwt_required
from lib.chatSession import get_chat_history, get_all_chat_history, delete_chat, save_message
from services.chat_service import ask_rag_question
from utils.user_limits import check_user_active, check_chat_limit


chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat/ask", methods=["POST"])
@jwt_required
def chat_ask(user_id, **kwargs):
    is_active, error_msg = check_user_active(user_id)
    if not is_active:
        return jsonify({"success": False, "error": error_msg}), 403
    
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    session_id = (data.get("sessionId") or "").strip()
    if not question:
        return jsonify({"success": False, "error": "question is required"}), 400
    if not session_id:
        return jsonify({"success": False, "error": "sessionId is required"}), 400

    result = ask_rag_question(user_id=user_id, session_id=session_id, question=question, top_k=int(data.get("topK") or 5))
    status = 200 if result.get("success") else 500
    return jsonify(result), status

@chat_bp.route("/chat/history", methods=["GET"])
@jwt_required
def chat_history(user_id, **kwargs):
    is_active, error_msg = check_user_active(user_id)
    if not is_active:
        return jsonify({"success": False, "error": error_msg}), 403
    
    session_id = (request.args.get("sessionId") or "").strip()
    if not session_id:
        return jsonify({"success": False, "error": "sessionId is required"}), 400
    return jsonify(get_chat_history(user_id=user_id, session_id=session_id)), 200

@chat_bp.route("/chat/all-history", methods=["GET"])
@jwt_required
def get_chat_history(user_id, **kwargs):
    is_active, error_msg = check_user_active(user_id)
    if not is_active:
        return jsonify({"success": False, "error": error_msg}), 403
    
    return jsonify(get_all_chat_history(user_id=user_id)), 200


@chat_bp.route("/chat/delete-chat" , methods=["DELETE"])
@jwt_required
def delete_chat_history(user_id, **kwargs):
    is_active, error_msg = check_user_active(user_id)
    if not is_active:
        return jsonify({"success": False, "error": error_msg}), 403
    
    session_id = (request.args.get("sessionId") or "").strip()
    if not session_id:
       return jsonify({"success": False, "error": "sessionId is required"}), 400
    return jsonify(delete_chat(user_id=user_id , session_id=session_id)), 200


@chat_bp.route("/chat/new-session", methods=["POST"])
@jwt_required
def create_new_chat_session(user_id, **kwargs):
    is_active, error_msg = check_user_active(user_id)
    if not is_active:
        return jsonify({"success": False, "error": error_msg}), 403
    
    can_create, limit_error, limit_info = check_chat_limit(user_id)
    if not can_create:
        return jsonify({
            "success": False,
            "error": limit_error,
            "limit_info": limit_info
        }), 403
    
    session_id = str(uuid.uuid4())    
    return jsonify({
        "success": True,
        "sessionId": session_id,
        "limit_info": limit_info
    }), 201
    