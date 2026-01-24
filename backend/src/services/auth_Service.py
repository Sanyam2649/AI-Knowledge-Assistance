from werkzeug.security import generate_password_hash, check_password_hash
from configuration.Database import users_collection, documents_collection, document_chunks_collection
from core.user_auth import generate_jwt
from models.user import user_schema
from lib.vector_Store import store_documents
from lib.fileProcessor import validate_upload, validate_file
import os
import tempfile
from lib.fileProcessor import extract_text, chunk_text
from models.documents import document_schema
from models.document_chunk import document_chunk_schema
from bson import ObjectId
from lib.vectorDB import get_pinecone_index

def process_file(file):
    """
    Input: Flask FileStorage object
    Output: list of chunk dicts
    """

    # 1. Save uploaded file temporarily
    suffix = os.path.splitext(file.filename)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        # 2. Validate
        validation = validate_file(tmp_path)
        if not validation["valid"]:
            raise ValueError(validation["error"])
        text, page_count = extract_text(tmp_path)
        chunks = chunk_text(
            text=text,
            file_name=file.filename,
            file_type=file.mimetype,
            file_size=os.path.getsize(tmp_path),
            page_count=page_count
        )

        return chunks

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def register_user(data: dict):
    required_fields = ["firstName", "lastName", "email", "phone", "password"]
    missing = [f for f in required_fields if f not in data or not data[f].strip()]
    if missing:
        return {"success": False, "error": f"Missing fields: {', '.join(missing)}"}, 400

    if users_collection.find_one({"email": data["email"].lower()}):
        return {"success": False, "error": "Email already registered"}, 400

    password_hash = generate_password_hash(data["password"])
    # default role to "user" unless explicitly provided (admin creation can be gated later)
    user_doc = user_schema({**data, "role": data.get("role") or "user", "password_hash": password_hash})
    result = users_collection.insert_one(user_doc)

    user_doc["_id"] = str(result.inserted_id)
    user_doc.pop("password_hash")
    return {"success": True, "user": user_doc}, 201

def login_user(data: dict):
    required_fields = ["email", "password"]
    missing = [f for f in required_fields if f not in data or not data[f].strip()]
    if missing:
        return {"success": False, "error": f"Missing fields: {', '.join(missing)}"}, 400

    user = users_collection.find_one({"email": data["email"].lower()})
    if not user or not check_password_hash(user["password_hash"], data["password"]):
        return {"success": False, "error": "Invalid email or password"}, 401

    user["_id"] = str(user["_id"])
    user.pop("password_hash")

    token = generate_jwt(user["_id"], user["email"])
    return {"success": True, "user": user, "token": token}, 200

def handle_upload_documents(files, user_id, session_id):
    """
    Handles uploading documents for a user.
    Blocks inactive users and returns results for each file.
    """

    # Fetch user with only is_active field
    user = users_collection.find_one(
        {"_id": ObjectId(user_id)},
        {"is_active": 1}
    )

    # Treat user as inactive if not found or is_active is False/None
    is_active = user.get("is_active", False) if user else False
    if not is_active:
        # Return a structured response instead of raising an exception
        return {
            "results": [],
            "summary": {"totalFiles": len(files), "totalChunks": 0},
            "status": "error",
            "message": "Your account is inactive. Document upload is not allowed."
        }, 403

    # Active user: process files
    results = []
    total_chunks_processed = 0

    for file in files:
        try:
            validation = validate_upload(file)
            if not validation["valid"]:
                results.append({
                    "fileName": file.filename,
                    "status": "error",
                    "message": validation.get("error", "Invalid file")
                })
                continue

            chunks = process_file(file)
            if not chunks:
                results.append({
                    "fileName": file.filename,
                    "status": "error",
                    "message": "No extractable text found in file."
                })
                continue

            doc_insert = documents_collection.insert_one(
                document_schema({
                    "user_id": user_id,
                    "title": os.path.splitext(file.filename)[0],
                    "file_name": file.filename,
                    "file_type": file.mimetype or "application/octet-stream",
                })
            )
            document_id = str(doc_insert.inserted_id)

            for c in chunks:
                chunk_doc = document_chunk_schema({
                    "document_id": document_id,
                    "chunk_index": c["metadata"]["chunkIndex"],
                    "content": c["text"],
                    "embedding": None
                })
                document_chunks_collection.insert_one(chunk_doc)
                c["metadata"]["documentId"] = document_id

            store_result = store_documents(chunks, user_id, session_id)
            if store_result["success"]:
                total_chunks_processed += len(chunks)
                results.append({
                    "fileName": file.filename,
                    "status": "success",
                    "chunks": len(chunks),
                    "documentId": document_id,
                    "message": f"Processed {len(chunks)} chunks with Gemini embeddings"
                })
            else:
                raise Exception(store_result.get("error", "Failed to store vectors"))

        except Exception as e:
            results.append({
                "fileName": file.filename,
                "status": "error",
                "message": str(e)
            })

    summary = {
        "totalFiles": len(files),
        "totalChunks": total_chunks_processed,
    }

    return {"results": results, "summary": summary}, 200

def delete_documents(document_id: str, user_id: str) -> bool:
    document_object_id = ObjectId(document_id)
    user_object_id = ObjectId(user_id)
    doc = documents_collection.find_one(
        {
            "_id": document_object_id,
            "user_id": user_object_id,
        }
    )

    if not doc:
        return False

    document_chunks_collection.delete_many(
        {"document_id": document_object_id}
    )

    documents_collection.delete_one(
        {
            "_id": document_object_id,
            "user_id": user_object_id,
        }
    )

    try:
        index = get_pinecone_index()
        index.delete(
            filter={
                "userId": str(user_id),
                "fileName": doc.get("file_name"),
            }
        )
    except Exception as e:
        # Intentionally not failing hard here
        print(f"❌ Pinecone delete failed: {e}")

    return True