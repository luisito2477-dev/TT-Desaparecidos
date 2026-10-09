from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from app.schemas.schemas import (
    FichaResponse,
    EmbeddingCreate, 
    EmbeddingResponse
)
from app.dependency.dependencies import get_embedding_service
from app.service.nlp_service import EmbeddingService
from app.service.pipeline_service import pipeline
from typing import Any
from app.config.config import TRANSFORMER_MODEL

router: APIRouter = APIRouter(
    prefix="/api/ms-ia",
    tags=["ms-ia"]
)

@router.post("/extraer-datos", response_model=FichaResponse)
async def extraer_datos(
    ficha: UploadFile = File(...),
    embedding_service: EmbeddingService = Depends(get_embedding_service)
) -> FichaResponse:
    """
    Endpoint para extraer los datos de la ficha de busqueda.
    El usuario enviara la ficha en formato pdf y se le devolvera todos
    los datos extraidos de este
    """
    return await pipeline(ficha, embedding_service)
    


@router.post("/embedding", response_model=EmbeddingResponse)
async def generar_embedding(
    payload: EmbeddingCreate,
    service: EmbeddingService = Depends(get_embedding_service)
) -> EmbeddingResponse:
    """
    Endpoint que genera un embedding.
    El usuario envia un texto y se le devolvera un vector como
    respuesta
    """

    vector: list[float] = await run_in_threadpool(service.generar_embedding, payload.texto_busqueda)
    return EmbeddingResponse(
        embedding=vector,
        dimension=service.obtener_dimension(),
        modelo=service.model_name
    )