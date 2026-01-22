from flask import request, jsonify, Blueprint
from services.auth_Service import register_user, login_user, handle_upload_documents
from core.user_auth import jwt_required
user_bp = Blueprint("user", __name__)

@user_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.json
    response, status = register_user(data)
    return jsonify(response), status

@user_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.json
    response, status = login_user(data)
    return jsonify(response), status

@user_bp.route("/documents/upload", methods=["POST"])
@jwt_required
def upload_documents(user_id, **kwargs):
    session_id = request.form.get("sessionId")
    files = request.files.getlist("files")

    if not files:
        return jsonify({"success": False, "error": "No files provided"}), 400

    if not session_id:
        return jsonify({"success": False, "error": "sessionId is required"}), 400

    result = handle_upload_documents(files, user_id, session_id)
    return jsonify(result), 200

    

