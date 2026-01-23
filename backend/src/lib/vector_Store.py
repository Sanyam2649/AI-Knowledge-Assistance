import time
import re
from lib.vectorDB import get_pinecone_index, get_pinecone_chat_index
from configuration.embedding import EXPECTED_EMBEDDING_DIM, embed_texts
from configuration.llm_client import llm


def is_greeting(query: str) -> bool:
    return bool(re.match(
        r"^(hi|hello|hey|hii|hola|good morning|good evening|good afternoon)\b",
        query.strip().lower()
    ))

def generate_vector_id(file_name: str, chunk_index: int) -> str:
    safe_file_name = "".join(c if c.isalnum() else "_" for c in file_name)[:50]
    timestamp = int(time.time() * 1000)
    return f"doc_{safe_file_name}_{timestamp}_{chunk_index}"

def generate_chat_vector_id(session_id: str, timestamp=None) -> str:
    if timestamp is None:
        timestamp = int(time.time() * 1000)
    return f"{session_id}-{timestamp}"

def store_documents(documents: list, user_id: str, session_id: str):
    index = get_pinecone_index()
    try:
        print(f"📦 Generating embeddings for {len(documents)} documents...")

        texts = [doc["text"] for doc in documents]
        embeddings = embed_texts(texts)

        vectors = []
        for i, doc in enumerate(documents):
            if len(embeddings[i]) != EXPECTED_EMBEDDING_DIM:
                raise ValueError(
                    f"Embedding dimension mismatch for chunk {i}: "
                    f"expected {EXPECTED_EMBEDDING_DIM}, got {len(embeddings[i])}"
                )

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
    """
    Save a single chat message as a vector in Pinecone only (no MongoDB storage).
    """
    try:
        index = get_pinecone_chat_index()
        print(f"💬 Generating embedding for chat message...")

        # Batch embedding even for single message (validates shape)
        vector = embed_texts([message])[0]

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

        index.upsert([payload])
        print(f"🚀 Message vector saved with id: {vector_id}")

        return {"success": True, "id": vector_id}

    except Exception as e:
        print(f"❌ Error saving message to vector store: {e}")
        return {"success": False, "error": str(e)}

def search_similar_documents(query: str, user_id: str, session_id: str, limit=5):
    """
    Single Pinecone query with hybrid reranking.
    """
    index = get_pinecone_index()
    try:
        query_vector = embed_texts([query])[0]

        search_response = index.query(
            vector=query_vector,
            top_k=50,
            include_metadata=True,
            include_values=False,
            filter={"userId": user_id}
        )

        if not search_response.matches:
            return {"success": True, "matches": [], "totalFound": 0, "message": "No matches found"}

        scored_matches = []
        for match in search_response.matches:
            semantic_score = match.score
            keyword_score = calculate_keyword_relevance(match.metadata.get("text", ""), query)
            hybrid_score = semantic_score * 0.6 + min(keyword_score / 5, 1) * 0.4

            scored_matches.append({
                "id": match.id,
                "semanticScore": semantic_score,
                "hybridScore": hybrid_score,
                "text": match.metadata.get("text", ""),
                "metadata": match.metadata
            })

        top_matches = sorted(scored_matches, key=lambda m: m["hybridScore"], reverse=True)[:limit]

        return {
            "success": True,
            "matches": top_matches,
            "totalFound": len(search_response.matches),
            "message": f"Found {len(top_matches)} relevant matches"
        }

    except Exception as e:
        print(f"❌ Error searching documents: {e}")
        return {"success": False, "error": str(e), "matches": []}

def calculate_keyword_relevance(text: str, query: str) -> float:
    stop_words = {"what", "how", "when", "where", "which", "with", "from", "the", "and", "for"}
    query_keywords = [w.lower() for w in re.findall(r'\b\w+\b', query)
                      if len(w) >= 3 and w.lower() not in stop_words]
    if not query_keywords:
        return 0
    score = sum(len(re.findall(rf'\b{re.escape(kw)}\b', text.lower())) for kw in query_keywords)
    return score / len(query_keywords)

def answer_question(query: str, user_id: str, session_id: str, top_k: int = 5, max_context_chars: int = 4000) -> str:
    """
    Retrieves top relevant documents from Pinecone, constructs a context, 
    and asks the LLM (Gemini) to answer based only on the retrieved context.

    Args:
        query: User question
        user_id: ID of the user
        session_id: Current chat session
        top_k: Number of top documents to retrieve
        max_context_chars: Maximum characters of context to send to LLM

    Returns:
        str: LLM-generated answer or fallback message
    """
    
    if is_greeting(query):
       return "Hi! 👋 How can I help you?"

    search_result = search_similar_documents(query, user_id, session_id, limit=top_k)
    matches = search_result.get("matches", [])

    if not matches:
        return "I couldn't find relevant information in your uploaded documents for that question."

    # 2️⃣ Rerank matches using hybridScore descending
    matches.sort(key=lambda x: x.get("hybridScore", 0), reverse=True)

    # 3️⃣ Build context safely
    context_parts = []
    chars_used = 0
    for m in matches:
        text = m.get("text", "")
        if not text:
            continue
        if chars_used + len(text) > max_context_chars:
            break
        context_parts.append(f"- {text}")
        chars_used += len(text)

    context = "\n\n".join(context_parts)

    messages = [
{
  "role": "system",
  "content": (
    "You are a professional analytical assistant. Answer strictly using the provided context.\n\n"

    "Hard constraints:\n"
    "- Maximum length: 120–150 words total.\n"
    "- Prefer short paragraphs or compact bullet points.\n"
    "- No filler, no repetition, no examples unless essential.\n"
    "- Do NOT restate the question.\n"
    "- Focus only on key points that directly answer the question.\n\n"

    "Formatting rules:\n"
    "- Use at most 3 section headings.\n"
    "- Each section may have at most 3 bullet points.\n"
    "- Each bullet must be one sentence only.\n\n"

    "Content rules:\n"
    "- Use ONLY the given context.\n"
    "- Synthesize and condense; do not quote or paraphrase excessively.\n"
    "- If the context is insufficient, respond exactly with:\n"
    "  'I don't know based on the provided documents.'"
  )
},

{
  "role": "user",
  "content": (
      f"Context:\n{context}\n\n"
      f"Question:\n{query}\n\n"
      "Answer concisely using only the context.\n"
      "- Key points only\n"
      "- Short bullets or brief paragraphs\n"
      "- No introductions, no conclusions, no filler"
  )
}
         ]


    try:
        response = llm.chat_completion(messages=messages)
        answer = response["choices"][0]["message"]["content"].strip()
        if not answer:
            return "I couldn't find relevant information in your uploaded documents for that question."
        return answer
    except Exception as e:
        print(f"❌ LLM error: {e}")
        return "I couldn't generate an answer at this time. Please try again later."

