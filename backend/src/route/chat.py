from flask import Blueprint, jsonify, request

from core.user_auth import jwt_required
from lib.chatSession import get_chat_history, get_all_chat_history, delete_chat
from services.chat_service import ask_rag_question


chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat/ask", methods=["POST"])
@jwt_required
def chat_ask(user_id, **kwargs):
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
    session_id = (request.args.get("sessionId") or "").strip()
    if not session_id:
        return jsonify({"success": False, "error": "sessionId is required"}), 400
    return jsonify(get_chat_history(user_id=user_id, session_id=session_id)), 200

@chat_bp.route("/chat/all-history", methods=["GET"])
@jwt_required
def get_chat_history(user_id, **kwargs):
    return jsonify(get_all_chat_history(user_id=user_id)), 200


@chat_bp.route("/chat/delete-chat" , methods=["DELETE"])
@jwt_required
def delete_chat_history(user_id, **kwargs):
        session_id = (request.args.get("sessionId") or "").strip()
        if not session_id:
           return jsonify({"success": False, "error": "sessionId is required"}), 400
        return jsonify(delete_chat(user_id=user_id , session_id=session_id)), 200
    