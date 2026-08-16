from logging import getLogger, Logger
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.exception.exceptions import *

logger: Logger = getLogger(__name__)

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global Exception Handler para manejar excepciones inesperadas.
    """
    logger.error(f"Error no controlado en {request.url.path}: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "code": "INTERNAL_SERVER_ERROR",
            "message": "Ocurrio un error inesperado en el ms-ia.",
            "detail": str(exc)
        }
    )

async def embedding_exception_handler(request: Request, ex: EmbeddingGenerationException) ->JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={
            "status": "error",
            "code": "EMBEDDING_FAILED",
            "message": ex.message
        }
    )

async def file_format_exception_handler(request: Request, ex: EmbeddingGenerationException) ->JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "status": "error",
            "code": "INVALID_FILE_FORMAT",
            "message": ex.message
        }
    )

