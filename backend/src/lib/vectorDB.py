import os
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_CHAT_INDEX_NAME
from configuration.vector import pc
# from pinecone.grpc import PineconeGRPC as Pinecone
from pinecone import ServerlessSpec

pinecone = None
pinecone_index = None
pinecone_chat_index = None

def get_pinecone_client():
    global pinecone
    if pinecone is None:
        if not PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY environment variable is required")
        pinecone = pc
        print("Pinecone client initialized")
    return pinecone

def get_pinecone_index():
    global pinecone_index
    if pinecone_index is None:
        pc = get_pinecone_client()
        if PINECONE_INDEX_NAME not in pc.list_indexes().names():
            print(f"Creating new index for Gemini: {PINECONE_INDEX_NAME}")
            pc.create_index(
              name=PINECONE_INDEX_NAME,
              dimension=768,
              metric="cosine",
              serverless=ServerlessSpec(
              cloud="aws",
              region="us-east-1"
             ),
             wait_until_ready=True
         )
            print(f"Index {PINECONE_INDEX_NAME} created successfully with 768 dimensions")
        else:
            print(f"Using existing index: {PINECONE_INDEX_NAME}")

        pinecone_index = pc.Index(PINECONE_INDEX_NAME)
    return pinecone_index

def get_pinecone_chat_index():
    global pinecone_chat_index
    if pinecone_chat_index is None:
        pc = get_pinecone_client()

        if PINECONE_CHAT_INDEX_NAME not in pc.list_indexes().names():
            print(f"Creating new chat index for Gemini: {PINECONE_CHAT_INDEX_NAME}")
            pc.create_index(
                name=PINECONE_CHAT_INDEX_NAME,
                dimension=768,
                metric="cosine",
                serverless=ServerlessSpec(
                  cloud="aws",
                  region="us-east-1"
                 ),
                wait_until_ready=True
            )
            print(f"Chat index {PINECONE_CHAT_INDEX_NAME} created successfully with 768 dimensions")
        else:
            print(f"Using existing chat index: {PINECONE_CHAT_INDEX_NAME}")

        pinecone_chat_index = pc.Index(PINECONE_CHAT_INDEX_NAME)
    return pinecone_chat_index
