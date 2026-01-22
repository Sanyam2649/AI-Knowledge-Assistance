from bson import ObjectId

def document_chunk_schema(data):
    document_id = data["document_id"]
    if isinstance(document_id, str):
        document_id = ObjectId(document_id)
    return {
        "document_id": document_id,
        "chunk_index": data["chunk_index"],
        "content": data["content"],
        "embedding": data.get("embedding")
    }
