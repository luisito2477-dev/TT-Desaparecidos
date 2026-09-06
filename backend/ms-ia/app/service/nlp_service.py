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
        """
        Funcion que devuelve el numero de dimensiones que posee el vector
        """
        return self.model.get_embedding_dimension()

    def construir_texto_semantico(self, data: dict) -> str:
        """
        Funcion que construye el texto de la ficha que se utilizara para generar el vector.
        Se ocuparan 4 datos para la generacion de este texto:
        - Sexo
        - Caracteristicas fisicas
        - Senas Particulares
        - Prendas Vestir
        """
        partes = []
        
        # Sexo ayuda a contextualizar sin meter ruido
        if data.get("Sexo") and data.get("Sexo") != "SIN DATO":
            partes.append(f"Persona de sexo {data.get('Sexo').lower()}.")
            
        if data.get("Caracteristicas_Fisicas") and data.get("Caracteristicas_Fisicas") != "SIN DATO":
            partes.append(f"Características físicas: {data.get('Caracteristicas_Fisicas')}.")
            
        if data.get("Senas_Particulares") and data.get("Senas_Particulares") != "SIN DATO":
            partes.append(f"Señas particulares: {data.get('Senas_Particulares')}.")
            
        if data.get("Prendas_Vestir") and data.get("Prendas_Vestir") != "SIN DATO":
            partes.append(f"Vestimenta: {data.get('Prendas_Vestir')}.")

        return " ".join(partes)