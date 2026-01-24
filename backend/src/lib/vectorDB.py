import os
from utils.api_config_helper import (
    get_pinecone_api_key,
    get_pinecone_index_name,
    get_pinecone_chat_index_name
)
from configuration.vector import pc
# from pinecone.grpc import PineconeGRPC as Pinecone
from pinecone import ServerlessSpec

pinecone = None
pinecone_index = None
pinecone_chat_index = None

def get_pinecone_client():
    global pinecone
    if pinecone is None:
        api_key = get_pinecone_api_key()
        if not api_key:
            raise ValueError("PINECONE_API_KEY is required. Please set it in the admin API configuration or environment variable.")
        pinecone = pc
        print("Pinecone client initialized")
    return pinecone

def get_pinecone_index():
    global pinecone_index
    if pinecone_index is None:
        pc_client = get_pinecone_client()
        index_name = get_pinecone_index_name()
        if not index_name:
            raise ValueError("PINECONE_INDEX_NAME is required. Please set it in the admin API configuration or environment variable.")
        
        if index_name not in pc_client.list_indexes().names():
            print(f"Creating new index for Gemini: {index_name}")
            pc_client.create_index(
              name=index_name,
              dimension=768,
              metric="cosine",
              serverless=ServerlessSpec(
              cloud="aws",
              region="us-east-1"
             ),
             wait_until_ready=True
         )
            print(f"Index {index_name} created successfully with 768 dimensions")
        else:
            print(f"Using existing index: {index_name}")

        pinecone_index = pc_client.Index(index_name)
    return pinecone_index

def get_pinecone_chat_index():
    global pinecone_chat_index
    if pinecone_chat_index is None:
        pc_client = get_pinecone_client()
        chat_index_name = get_pinecone_chat_index_name()
        if not chat_index_name:
            raise ValueError("PINECONE_CHAT_INDEX_NAME is required. Please set it in the admin API configuration or environment variable.")

        if chat_index_name not in pc_client.list_indexes().names():
            print(f"Creating new chat index for Gemini: {chat_index_name}")
            pc_client.create_index(
                name=chat_index_name,
                dimension=768,
                metric="cosine",
                serverless=ServerlessSpec(
                  cloud="aws",
                  region="us-east-1"
                 ),
                wait_until_ready=True
            )
            print(f"Chat index {chat_index_name} created successfully with 768 dimensions")
        else:
            print(f"Using existing chat index: {chat_index_name}")

        pinecone_chat_index = pc_client.Index(chat_index_name)
    return pinecone_chat_index
