from logging import getLogger, Logger

from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.exception.exceptions import (
    EmbeddingGenerationException,
    FichaIlegibleException,
    FileFormatNotAllowedException,
)

logger: Logger = getLogger(__name__)


def _respuesta(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"status": "error", "code": code, "message": message},
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Maneja excepciones inesperadas. No se expone el detalle interno al cliente.
    """
    logger.error(f"Error no controlado en {request.url.path}: {exc}", exc_info=True)
    return _respuesta(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "INTERNAL_SERVER_ERROR",
        "Ocurrio un error inesperado en el ms-ia.",
    )


async def embedding_exception_handler(request: Request, ex: EmbeddingGenerationException) -> JSONResponse:
    logger.error(f"Error al generar embedding en {request.url.path}: {ex.message}")
    return _respuesta(status.HTTP_502_BAD_GATEWAY, "EMBEDDING_FAILED", ex.message)


async def file_format_exception_handler(request: Request, ex: FileFormatNotAllowedException) -> JSONResponse:
    return _respuesta(status.HTTP_400_BAD_REQUEST, "INVALID_FILE_FORMAT", ex.message)


async def ficha_ilegible_exception_handler(request: Request, ex: FichaIlegibleException) -> JSONResponse:
    logger.warning(f"Ficha no procesable en {request.url.path}: {ex.message}")
    return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, "UNREADABLE_FICHA", ex.message)
