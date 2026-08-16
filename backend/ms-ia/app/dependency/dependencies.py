from fastapi import Request
from app.service.nlp_service import EmbeddingService

def get_embedding_service(request: Request) -> EmbeddingService:
    """
    Funcion para obtener el servicio guardado en el app.state durante
    el lifespan, esto nos servira despues para poder hacer inyeccion de dependencias
    en el controller.py
    """
    return request.app.state.embedding_service