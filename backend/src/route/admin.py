from bson import ObjectId
from flask import Blueprint, jsonify, request

from config import DEFAULT_TOKEN_COST_PER_1K_USD
from configuration.Database import chat_sessions_collection, documents_collection
from core.user_auth import jwt_required, require_role


admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/admin/documents", methods=["GET"])
@jwt_required
@require_role("admin")
def admin_list_documents(user_id, **kwargs):
    docs = documents_collection.find({}).sort("created_at", -1)
    out = []
    for d in docs:
        out.append(
            {
                "_id": str(d["_id"]),
                "user_id": str(d.get("user_id")) if d.get("user_id") else None,
                "title": d.get("title"),
                "file_name": d.get("file_name"),
                "file_type": d.get("file_type"),
                "status": d.get("status"),
                "is_enabled": d.get("is_enabled", True),
                "created_at": d.get("created_at"),
            }
        )
    return jsonify({"success": True, "documents": out}), 200


@admin_bp.route("/admin/documents/<doc_id>/toggle", methods=["POST"])
@jwt_required
@require_role("admin")
def admin_toggle_document(user_id, doc_id, **kwargs):
    body = request.get_json(silent=True) or {}
    enabled = body.get("is_enabled")
    if enabled is None:
        return jsonify({"success": False, "error": "is_enabled is required"}), 400

    res = documents_collection.update_one({"_id": ObjectId(doc_id)}, {"$set": {"is_enabled": bool(enabled)}})
    if res.matched_count == 0:
        return jsonify({"success": False, "error": "Document not found"}), 404
    return jsonify({"success": True, "documentId": doc_id, "is_enabled": bool(enabled)}), 200


def _estimate_tokens(text: str) -> int:
    # simple heuristic: ~4 chars/token average for English
    return max(1, int(len(text or "") / 4))


@admin_bp.route("/admin/queries", methods=["GET"])
@jwt_required
@require_role("admin")
def admin_queries(user_id, **kwargs):
    """
    Monitor user queries/responses from Mongo chat sessions.
    This is a lightweight view suitable for an admin dashboard.
    """
    limit = int(request.args.get("limit") or 50)
    sessions = chat_sessions_collection.find({}).sort("updatedAt", -1).limit(limit)

    items = []
    total_tokens = 0
    for s in sessions:
        msgs = s.get("messages", [])
        # compute per-session token estimate
        sess_tokens = sum(_estimate_tokens(m.get("message", "")) for m in msgs)
        total_tokens += sess_tokens
        items.append(
            {
                "userId": s.get("userId"),
                "sessionId": s.get("sessionId"),
                "messageCount": len(msgs),
                "updatedAt": s.get("updatedAt"),
                "estimatedTokens": sess_tokens,
            }
        )

    estimated_cost_usd = (total_tokens / 1000.0) * DEFAULT_TOKEN_COST_PER_1K_USD
    return (
        jsonify(
            {
                "success": True,
                "sessions": items,
                "totals": {
                    "estimatedTokens": total_tokens,
                    "estimatedCostUsd": estimated_cost_usd,
                    "costPer1kTokensUsd": DEFAULT_TOKEN_COST_PER_1K_USD,
                },
            }
        ),
        200,
    )


