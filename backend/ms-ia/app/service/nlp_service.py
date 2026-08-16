from sentence_transformers import SentenceTransformer
from app.exception.exceptions import EmbeddingGenerationException

class EmbeddingService:
    def __init__(self, model_name: str) -> EmbeddingService:
        self.model: SentenceTransformer = SentenceTransformer(model_name)

    def generar_embedding(self, texto: str) -> list[float]:
        """
        Funcion que se recibe un texto y devuelve un vector/embedding
        """
        try:
            return self.model.encode(texto).tolist()
        except Exception:
            raise EmbeddingGenerationException("No se pudo procesar el texto para el modelo SBERT.")
         

    def obtener_dimension(self) -> int:
        return self.model.get_embedding_dimension()