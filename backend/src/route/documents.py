from bson import ObjectId
from flask import Blueprint, jsonify, request
from services.auth_Service import delete_documents

from configuration.Database import documents_collection
from core.user_auth import jwt_required


documents_bp = Blueprint("documents", __name__)


@documents_bp.route("/documents/list", methods=["GET"])
@jwt_required
def list_documents(user_id, **kwargs):
    docs = documents_collection.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    out = []
    for d in docs:
        out.append(
            {
                "_id": str(d["_id"]),
                "title": d.get("title"),
                "file_name": d.get("file_name"),
                "file_type": d.get("file_type"),
                "status": d.get("status"),
                "is_enabled": d.get("is_enabled", True),
                "created_at": d.get("created_at"),
            }
        )
    return jsonify({"success": True, "documents": out}), 200

@documents_bp.route("/documents/delete/<document_id>", methods=["DELETE"])
@jwt_required
def delete_document(user_id, document_id, **kwargs):
    deleted = delete_documents(document_id, user_id)

    if not deleted:
        return jsonify(
            {
                "success": False,
                "message": "Document not found",
            }
        ), 404

    return jsonify(
        {
            "success": True,
            "message": "Document deleted successfully",
        }
    ), 200


