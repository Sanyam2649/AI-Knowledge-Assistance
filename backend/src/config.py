import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "")
PINECONE_CHAT_INDEX_NAME = os.getenv("PINECONE_CHAT_INDEX_NAME", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_URL = os.getenv("GEMINI_API_URL", "")
# GROK_API_KEY = os.getenv("GROK_API_URL", "")
# GROK_API_URL = os.getenv("GROK_API_URL", "https://api.x.ai/v1")
# GROK_MODEL = os.getenv("GROK_MODEL", "grok-beta") 

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
HF_MODAL = os.getenv("HF_MODAL", "")
API_KEY_SECRET = os.getenv("API_KEY_SECRET", "dev-secret-change-me")
FRONTEND_URL=os.getenv("FRONTEND_URL", "http://localhost:3000")

_jwt_exp_raw = os.getenv("JWT_EXP_DELTA_SECONDS", "86400")
try:
    JWT_EXP_DELTA_SECONDS = int(_jwt_exp_raw)
except Exception:
    JWT_EXP_DELTA_SECONDS = 86400
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/embedding-001")

# Admin monitoring defaults (override via env if desired)
DEFAULT_TOKEN_COST_PER_1K_USD = float(os.getenv("DEFAULT_TOKEN_COST_PER_1K_USD", "0.002"))