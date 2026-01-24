from sentence_transformers import SentenceTransformer
from utils.api_config_helper import get_hf_modal

HF_MODAL=get_hf_modal()
model = SentenceTransformer(HF_MODAL)
EXPECTED_EMBEDDING_DIM = model.get_sentence_embedding_dimension()

def embed_text(text: str) -> list[float]:
    """
    Generate embedding for a single string.
    """
    embedding = model.encode(text, normalize_embeddings=False)

    if embedding.ndim != 1:
        raise ValueError(f"Invalid embedding shape: {embedding.shape}")

    if len(embedding) != EXPECTED_EMBEDDING_DIM:
        raise ValueError(
            f"Embedding dimension mismatch: "
            f"expected {EXPECTED_EMBEDDING_DIM}, got {len(embedding)}"
        )

    return embedding.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of strings in batch.
    Avoids repeated sequential calls to the model.
    """
    embeddings = model.encode(texts, normalize_embeddings=False)

    # Ensure correct shape
    if embeddings.ndim == 1:
        embeddings = embeddings.reshape(1, -1)

    result = []
    for i, emb in enumerate(embeddings):
        if len(emb) != EXPECTED_EMBEDDING_DIM:
            raise ValueError(
                f"Embedding dimension mismatch for text {i}: "
                f"expected {EXPECTED_EMBEDDING_DIM}, got {len(emb)}"
            )
        result.append(emb.tolist())

    return result
