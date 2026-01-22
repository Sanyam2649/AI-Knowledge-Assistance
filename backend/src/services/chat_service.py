from __future__ import annotations

import random
from typing import Any, Dict, List, Tuple

from bson import ObjectId

from configuration import Database as db_mod
from lib.chatSession import save_message, get_chat_history
from lib.vector_Store import search_similar_documents
from configuration.gemini_client import gemini

def _get_fallback_message() -> str:
    """
    Returns a random fallback message when AI service is unavailable.
    """
    fallback_messages = [
        "I'm currently experiencing high demand and may take a moment to respond. Based on your documents, I found relevant information, but I'm temporarily unable to process it fully. Please try again in a few moments.",
        "The AI service is temporarily busy. I've found relevant information in your documents, but I need a moment to process your question. Please try again shortly.",
        "I'm processing a lot of requests right now. I found relevant content in your documents, but I'll need you to try again in a moment for a complete answer.",
        "Due to high traffic, I'm experiencing a slight delay. I've located relevant information in your documents - please try your question again in a few seconds.",
        "I'm temporarily at capacity. I found relevant information in your uploaded documents, but I need a brief moment before I can provide a full response. Please try again shortly.",
        "The service is currently handling many requests. I've identified relevant content in your documents - please wait a moment and try again for a detailed answer.",
        "I'm experiencing temporary high demand. I found information related to your question in your documents, but I need a moment to process it. Please try again soon.",
        "Due to current service load, I'm temporarily unable to provide a full response. I've found relevant information in your documents - please try again in a few moments.",
    ]
    return random.choice(fallback_messages)


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
        
        # Handle empty string or None
        if not doc_id or doc_id == "":
            missing_doc_id_count += 1
            # For backward compatibility: if documentId is missing, 
            # allow the match if user has enabled documents (likely old upload)
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


def build_rag_context(matches: List[Dict[str, Any]], max_chars: int = 4000) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Build a context string plus normalized sources list from Pinecone matches.
    """
    sources: List[Dict[str, Any]] = []
    parts: List[str] = []
    used = 0

    for m in matches:
        md = m.get("metadata") or {}
        text = (m.get("text") or md.get("text") or "").strip()
        if not text:
            continue

        source = {
            "documentId": md.get("documentId"),
            "fileName": md.get("fileName"),
            "chunkIndex": md.get("chunkIndex"),
            "score": m.get("hybridScore", m.get("semanticScore", m.get("score"))),
        }
        sources.append(source)

        snippet = text[:1000]
        block = f"[Source: {source.get('fileName')} | chunk {source.get('chunkIndex')}]\n{snippet}\n"
        if used + len(block) > max_chars:
            break
        parts.append(block)
        used += len(block)

    return "\n".join(parts).strip(), sources

def llm_answer_with_gemini(question: str, context: str) -> str:
    """
    Uses Gemini LLM to answer grounded strictly in retrieved documents.
    """
    if not context:
        return "I couldn't find relevant information in your uploaded documents for that question."

    messages = [
        {
            "role": "system",
            "content": (
                "You are a document-based assistant.\n"
                "Answer ONLY using the provided context.\n"
                "If the answer is not in the context, say you don't know.\n"
                "Be concise, factual, and helpful."
            )
        },
        {
            "role": "user",
            "content": (
                f"Context:\n{context}\n\n"
                f"Question:\n{question}"
            )
        }
    ]
    
    try:
        response = gemini.chat_completion(
            messages=messages,
            temperature=0.1,
            max_tokens=512
        )
        
        if not response or "choices" not in response or not response["choices"]:
            print("❌ Invalid response format from Gemini API")
            return _get_fallback_message()
        
        return response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"❌ Error calling Gemini API: {e}")
        # Return fallback message instead of raising
        return _get_fallback_message()


def ask_rag_question(*, user_id: str, session_id: str, question: str, top_k: int = 5) -> Dict[str, Any]:
    try:
        search = search_similar_documents(query=question, user_id=user_id, session_id=session_id, limit=top_k)
        if not search.get("success"):
            return {"success": False, "error": search.get("error", "Retrieval failed")}

        search_matches = search.get("matches", [])
        print(f"📊 Found {len(search_matches)} matches from Pinecone search")
        
        enabled = _enabled_document_ids_for_user(user_id)
        print(f"📋 Enabled document IDs for user: {enabled}")
        
        # Debug: show documentIds in matches
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

        context, sources = build_rag_context(matches)
        
        try:
            answer = llm_answer_with_gemini(question, context)
        except Exception as e:
            error_str = str(e)
            print(f"❌ Error generating answer with Gemini: {e}")
            
            # Use fallback message instead of returning error
            answer = _get_fallback_message()
            print(f"📝 Using fallback message due to API error")

        # 3) persist chat (always save, even with fallback message)
        save_message(user_id=user_id, session_id=session_id, role="user", message=question)
        save_message(user_id=user_id, session_id=session_id, role="assistant", message=answer)

        return {"success": True, "answer": answer, "sources": sources}
    except Exception as e:
        print(f"❌ Unexpected error in ask_rag_question: {e}")
        return {"success": False, "error": f"An unexpected error occurred: {str(e)}"}
