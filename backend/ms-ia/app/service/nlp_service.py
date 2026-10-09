from sentence_transformers import SentenceTransformer
from app.exception.exceptions import EmbeddingGenerationException
from typing import Dict, Any, Optional
class EmbeddingService:
    def __init__(self, model_name: str) -> EmbeddingService:
        self.model_name = model_name
        self.model: SentenceTransformer = SentenceTransformer(model_name)

    def generar_embedding(self, texto: str) -> list[float]:
        """
        Funcion que se recibe un texto y devuelve un vector/embedding
        """
        if not texto or not texto.strip():
            raise EmbeddingGenerationException("No se puede generar un embedding de un texto vacio.")
        try:
            return self.model.encode(texto).tolist()
        except Exception as ex:
            raise EmbeddingGenerationException(
                "No se pudo procesar el texto para el modelo SBERT."
            ) from ex
         

    def obtener_dimension(self) -> int:
        """
        Funcion que devuelve el numero de dimensiones que posee el vector
        """
        obtener = (
            getattr(self.model, "get_sentence_embedding_dimension", None)
            or getattr(self.model, "get_embedding_dimension")
        )
        return obtener()

    @staticmethod
    def _valor(data: Dict[str, Any], campo: str) -> Optional[str]:
        valor = data.get(campo)
        if valor is None:
            return None
        valor = str(valor).strip()
        if not valor or valor.upper() == "SIN DATO":
            return None
        return valor

    def construir_texto_semantico(self, data: Dict[str, Any]) -> str:
        """
        Construye el texto de la ficha que se utilizara para generar el vector.
        Usa 4 datos:
        - Sexo
        - Caracteristicas fisicas
        - Senas particulares
        - Prendas de vestir
        Los campos sin dato se omiten para no introducir ruido.
        Devuelve "" si la ficha no tiene ningun campo util.
        """
        partes = []

        sexo = self._valor(data, "Sexo")
        caracteristicas = self._valor(data, "Caracteristicas_Fisicas")
        senas = self._valor(data, "Senas_Particulares")
        prendas = self._valor(data, "Prendas_Vestir")

        # Si no hay ningun campo descriptivo, el sexo por si solo no aporta un vector util
        if not (caracteristicas or senas or prendas):
            return ""

        if sexo:
            partes.append(f"Persona de sexo {sexo.lower()}.")
        if caracteristicas:
            partes.append(f"Características físicas: {caracteristicas}.")
        if senas:
            partes.append(f"Señas particulares: {senas}.")
        if prendas:
            partes.append(f"Vestimenta: {prendas}.")

        return " ".join(partes)