import time
from lib.vectorDB import get_pinecone_index, get_pinecone_chat_index
from configuration.embedding import embed_text
from pymongo import MongoClient
from datetime import datetime
import re
from configuration.Database import db
from configuration.llm_client import llm

chatSession = db["chat_sessions"]

def generate_vector_id(file_name: str, chunk_index: int) -> str:
    safe_file_name = "".join(c if c.isalnum() else "_" for c in file_name)[:50]
    timestamp = int(time.time() * 1000)
    return f"doc_{safe_file_name}_{timestamp}_{chunk_index}"

def generate_chat_vector_id(session_id: str, timestamp=None) -> str:
    if timestamp is None:
        timestamp = int(time.time() * 1000)
    return f"{session_id}-{timestamp}"

def message_schema(data):
    return {
        "role": data["role"],
        "message": data["message"],
        "timestamp": data.get("timestamp", datetime.utcnow())
    }

def chat_session_schema(data):
    return {
        "userId": data["userId"],
        "sessionId": data["sessionId"],
        "messages": data.get("messages", []),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

def store_documents(documents: list, user_id: str, session_id: str):
    index = get_pinecone_index()
    try:
        print(f"📦 Generating embeddings for {len(documents)} documents")
        texts = [doc["text"] for doc in documents]
        embeddings = [embed_text(t) for t in texts]

        vectors = []
        for i, doc in enumerate(documents):
            vectors.append({
                "id": generate_vector_id(doc["metadata"]["fileName"], doc["metadata"]["chunkIndex"]),
                "values": embeddings[i],
                "metadata": {
                    "fileName": doc["metadata"]["fileName"],
                    "fileType": doc["metadata"]["fileType"],
                    "fileSize": doc["metadata"]["fileSize"],
                    "chunkIndex": doc["metadata"]["chunkIndex"],
                    "totalChunks": doc["metadata"]["totalChunks"],
                    "text": doc["text"][:1000],
                    "uploadedAt": doc["metadata"]["uploadedAt"],
                    "pageCount": doc["metadata"].get("pageCount", 0),
                    "chunkId": doc["metadata"]["chunkId"],
                    "documentId": doc["metadata"].get("documentId", ""),
                    "userId": user_id,
                    "sessionId": session_id
                }
            })

        print(f"🚀 Storing {len(vectors)} vectors in Pinecone...")
        response = index.upsert(vectors=vectors)
        return {"success": True, "count": len(vectors), "upserted": response.get("upsertedCount", len(vectors))}
    except Exception as e:
        print(f"❌ Error storing documents: {e}")
        return {"success": False, "error": str(e)}

def save_message_to_vector_store(user_id: str, session_id: str, role: str, message: str):
    try:
        index = get_pinecone_chat_index()
        print(f"💬 Generating embedding for chat message (user: {user_id}, session: {session_id})...")
        vector = embed_text(message)
        vector_id = generate_chat_vector_id(session_id)

        payload = {
            "id": vector_id,
            "values": vector,
            "metadata": {
                "userId": user_id,
                "sessionId": session_id,
                "role": role,
                "text": message[:1000],
                "createdAt": time.time()
            }
        }

        print(f"🚀 Saving chat message vector {vector_id} to Pinecone...")
        index.upsert([payload])

        # Also save in MongoDB
        chatSession.update_one(
            {"userId": user_id, "sessionId": session_id},
            {"$push": {"messages": message_schema({"role": role, "message": message})},
             "$set": {"updatedAt": datetime.utcnow()}},
            upsert=True
        )

        return {"success": True, "id": vector_id}
    except Exception as e:
        print(f"❌ Error saving message: {e}")
        return {"success": False, "error": str(e)}

def search_similar_messages(query: str, user_id: str, session_id: str, top_k=5):
    try:
        index = get_pinecone_chat_index()
        query_vector = embed_text(query)

        results = index.query(
            vector=query_vector,
            top_k=top_k,
            filter={"userId": user_id, "sessionId": session_id},
            include_metadata=True
        )

        matches = [{
            "id": m.id,
            "score": m.score,
            "metadata": {
                "text": m.metadata.get("text", ""),
                "role": m.metadata.get("role", "user"),
                "userId": m.metadata.get("userId"),
                "sessionId": m.metadata.get("sessionId")
            }
        } for m in results.matches] if results.matches else []

        return {"success": True, "matches": matches}
    except Exception as e:
        print(f"❌ Error searching chat messages: {e}")
        return {"success": False, "error": str(e)}

def delete_chat_session(session_id: str, user_id: str):
    try:
        index = get_pinecone_chat_index()
        index.delete(filter={"sessionId": session_id})
        chatSession.delete_one({"sessionId": session_id, "userId": user_id})
        return {"success": True, "message": f"Deleted chat session for user {user_id}, session {session_id}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def delete_long_term_memory(session_id: str, user_id: str):
    try:
        result = chatSession.delete_one({"sessionId": session_id, "userId": user_id})
        if result.deleted_count == 0:
            return {"success": False, "message": "No long-term memory found"}
        return {"success": True, "message": "Deleted long-term memory successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def search_similar_documents(query: str, user_id: str, session_id: str, limit=5):
    """
    Search documents in Pinecone for a user with hybrid scoring:
    semantic score (from embeddings) + keyword relevance.
    
    Documents are searchable across all sessions for a user.
    First tries current session, then falls back to all user documents.
    """
    index = get_pinecone_index()
    try:
        print(f"🔍 Searching for: '{query[:50]}...' (User: {user_id}, Session: {session_id})")
        query_vector = embed_text(query)

        # First try: search with current sessionId (for backward compatibility)
        search_response = index.query(
            vector=query_vector,
            top_k=max(limit * 3, 15),
            include_metadata=True,
            include_values=False,
            filter={"userId": user_id, "sessionId": session_id}
        )

        # If no results in current session, search across all user sessions
        if not search_response.matches:
            print(f"📋 No documents found in current session, searching across all user sessions...")
            search_response = index.query(
                vector=query_vector,
                top_k=max(limit * 3, 15),
                include_metadata=True,
                include_values=False,
                filter={"userId": user_id}  # Only filter by userId, not sessionId
            )
            if search_response.matches:
                print(f"✅ Found {len(search_response.matches)} documents from previous sessions")

        if not search_response.matches:
            return {
                "success": True,
                "matches": [],
                "totalFound": 0,
                "message": "No matches found"
            }

        # ---------- Hybrid Scoring ----------
        scored_matches = []
        for match in search_response.matches:
            semantic_score = match.score
            keyword_score = calculate_keyword_relevance(match.metadata.get("text", ""), query)
            normalized_keyword_score = min(keyword_score / 5, 1)
            hybrid_score = (semantic_score * 0.6) + (normalized_keyword_score * 0.4)

            scored_matches.append({
                "id": match.id,
                "semanticScore": semantic_score,
                "hybridScore": hybrid_score,
                "text": match.metadata.get("text", ""),
                "metadata": match.metadata
            })

        # Filter & sort by hybrid score
        relevant_matches = [m for m in scored_matches if m["hybridScore"] >= 0.15]
        relevant_matches.sort(key=lambda x: x["hybridScore"], reverse=True)
        relevant_matches = relevant_matches[:limit]

        return {
            "success": True,
            "matches": relevant_matches if relevant_matches else scored_matches[:limit],
            "totalFound": len(search_response.matches),
            "message": f"Found {len(relevant_matches)} relevant matches"
        }

    except Exception as e:
        print(f"❌ Error searching documents: {e}")
        return {"success": False, "error": str(e), "matches": []}

def calculate_keyword_relevance(text: str, query: str) -> float:
    """
    Simple keyword relevance scoring:
    - Ignores short/common words
    - Counts occurrence of keywords in text
    """
    stop_words = {"what", "how", "when", "where", "which", "with", "from", "the", "and", "for"}
    query_keywords = [word.lower() for word in re.findall(r'\b\w+\b', query) 
                      if len(word) >= 3 and word.lower() not in stop_words]

    if not query_keywords:
        return 0

    text_lower = text.lower()
    score = 0
    for kw in query_keywords:
        matches = re.findall(rf'\b{re.escape(kw)}\b', text_lower)
        if matches:
            score += len(matches)

    return score / len(query_keywords)


def answer_question(query: str, user_id: str, session_id: str, top_k: int = 5) -> str:
    """
    Full RAG pipeline:
    query → Pinecone → context → LLM → answer
    """
    search_result = search_similar_documents(
        query=query,
        user_id=user_id,
        session_id=session_id,
        limit=top_k
    )

    matches = search_result.get("matches", [])
    if not matches:
        return "I couldn't find relevant information in your uploaded documents for that question."

    # Build context from top matches
    context = "\n\n".join(
        f"- {m['text']}" for m in matches if m.get("text")
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are a document-based assistant.\n"
                "Answer ONLY using the provided context.\n"
                "If the answer is not present, say you don't know."
            )
        },
        {
            "role": "user",
            "content": (
                f"Context:\n{context}\n\n"
                f"Question:\n{query}"
            )
        }
    ]

    response = llm.chat_completion(messages=messages)
    return response["choices"][0]["message"]["content"]