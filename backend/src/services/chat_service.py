from __future__ import annotations

import random
from typing import Any, Dict, List, Tuple

from bson import ObjectId

from configuration import Database as db_mod
from lib.chatSession import save_message, get_chat_history
from lib.vector_Store import search_similar_documents
from configuration.gemini_client import gemini
from lib.vector_Store import answer_question, save_message_to_vector_store

def _enabled_document_ids_for_user(user_id: str) -> set[str]:
    """
    Returns enabled document ids for a user as strings.
    If a user has no documents, returns empty set.
    """
    docs = db_mod.documents_collection.find(
        {"user_id": ObjectId(user_id), "is_enabled": True},
        {"_id": 1},
    )
    return {str(d["_id"]) for d in docs}

def _filter_matches_to_enabled_docs(matches: List[Dict[str, Any]], enabled_doc_ids: set[str]) -> List[Dict[str, Any]]:
    if not enabled_doc_ids:
        return []    
    filtered = []
    missing_doc_id_count = 0
    for m in matches:
        metadata = m.get("metadata") or {}
        doc_id = metadata.get("documentId")
        
        if not doc_id or doc_id == "":
            missing_doc_id_count += 1
            if enabled_doc_ids:
                print(f"⚠️ Match missing documentId, allowing for backward compatibility")
                filtered.append(m)
            continue
        
        doc_id_str = str(doc_id).strip()
        # Try both with and without ObjectId conversion for flexibility
        if doc_id_str in enabled_doc_ids:
            filtered.append(m)
            print(f"✅ Match allowed: documentId {doc_id_str} is enabled")
        else:
            # Check if it's an ObjectId format issue
            try:
                from bson import ObjectId
                # Try comparing as ObjectId strings
                doc_obj_id = str(ObjectId(doc_id_str)) if ObjectId.is_valid(doc_id_str) else doc_id_str
                if doc_obj_id in enabled_doc_ids:
                    filtered.append(m)
                    print(f"✅ Match allowed after ObjectId conversion: {doc_obj_id}")
                else:
                    print(f"❌ Document ID '{doc_id_str}' (type: {type(doc_id).__name__}) not in enabled set")
                    print(f"   Enabled IDs are: {list(enabled_doc_ids)[:5]}...")  # Show first 5
            except Exception as e:
                print(f"❌ Error checking documentId {doc_id_str}: {e}")
    
    if missing_doc_id_count > 0:
        print(f"⚠️ {missing_doc_id_count} matches missing documentId (likely from old uploads)")
    
    return filtered

def ask_rag_question(*, user_id: str, session_id: str, question: str, top_k: int = 5) -> Dict[str, Any]:
    try:
        search = search_similar_documents(query=question, user_id=user_id, session_id=session_id, limit=top_k)
        if not search.get("success"):
            return {"success": False, "error": search.get("error", "Retrieval failed")}

        search_matches = search.get("matches", [])
        print(f"📊 Found {len(search_matches)} matches from Pinecone search")
        
        enabled = _enabled_document_ids_for_user(user_id)
        print(f"📋 Enabled document IDs for user: {enabled}")
        
        match_doc_ids = []
        for m in search_matches:
            doc_id = (m.get("metadata") or {}).get("documentId")
            if doc_id:
                match_doc_ids.append(str(doc_id))
            else:
                match_doc_ids.append("(missing)")
        print(f"🔍 Document IDs in search matches: {match_doc_ids}")
        print(f"🔍 Unique document IDs: {set([d for d in match_doc_ids if d != '(missing)'])}")
        
        matches = _filter_matches_to_enabled_docs(search_matches, enabled)
        print(f"✅ After filtering, {len(matches)} matches remain")

        if not matches:
            if not search_matches:
                return {
                    "success": False,
                    "error": "No documents found in vector store. Please upload documents first."
                }
            elif not enabled:
                return {
                    "success": False,
                    "error": "No enabled documents found for your account. Please contact support."
                }
            else:
                return {
                    "success": False,
                    "error": "No relevant documents found. The search results don't match your enabled documents. Please try a different question."
                }
        
        answer = answer_question(query=question, user_id=user_id, session_id=session_id, top_k=top_k)

        # Save user message - this will check limits if it's a new session
        user_msg_result = save_message(user_id=user_id, session_id=session_id, role="user", message=question)
        if not user_msg_result.get("success"):
            # If saving failed due to limits or inactive user, return the error
            return user_msg_result
        
        # Save assistant message (session already exists, so no limit check needed)
        save_message(user_id=user_id, session_id=session_id, role="assistant", message=answer)
        save_message_to_vector_store(user_id=user_id, session_id=session_id, role="user", message=question)
        save_message_to_vector_store(user_id=user_id, session_id=session_id, role="assistant", message=answer)

        return {"success": True, "answer": answer}
    except Exception as e:
        print(f"❌ Unexpected error in ask_rag_question: {e}")
        return {"success": False, "error": f"An unexpected error occurred: {str(e)}"}
