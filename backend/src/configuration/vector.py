from pinecone import Pinecone
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_CHAT_INDEX_NAME

pc = Pinecone(api_key=PINECONE_API_KEY)
database_index = pc.Index(PINECONE_INDEX_NAME)
chat_index = pc.Index(PINECONE_CHAT_INDEX_NAME)
