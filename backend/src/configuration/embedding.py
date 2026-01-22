from sentence_transformers import SentenceTransformer
from config import HF_MODAL


model = SentenceTransformer(HF_MODAL)

def embed_text(text: str) -> list[float]:
    embedding = model.encode(
        text,
        normalize_embeddings=False,
    )
    return embedding.tolist()
