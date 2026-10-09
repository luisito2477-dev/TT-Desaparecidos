from logging import Logger, getLogger
from app.service.ocr_service import ejecutar_ocr_limpio
from typing import Dict, Final, Any, Optional
from fastapi.concurrency import run_in_threadpool
from fastapi import UploadFile
from app.exception.exceptions import *
from app.service.nlp_service import EmbeddingService
from app.service.normalization_service import *


from app.schemas.schemas import FichaResponse, EmbeddingResponse
from app.config.config import TRANSFORMER_MODEL

logger: Logger = getLogger(__name__)

TIPOS_PERMITIDOS: Final[set[str]] = {"application/pdf", "application/octet-stream"}
FIRMA_PDF: Final[bytes] = b"%PDF-"
MAX_PDF_BYTES: Final[int] = 10 * 1024 * 1024 # 10MB


def _validar_pdf(ficha: UploadFile, pdf_bytes: bytes) -> None:
    """Valida que el archivo recibido sea un PDF real y de tamaño aceptable."""
    if ficha.content_type not in TIPOS_PERMITIDOS:
        raise FileFormatNotAllowedException("Formato del archivo no permitido. Solo se aceptan PDF.")
    if not pdf_bytes:
        raise FileFormatNotAllowedException("El archivo esta vacio.")
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise FileFormatNotAllowedException("El archivo excede el tamaño maximo permitido.")
    # La extension o el content-type pueden mentir; la firma del archivo no.
    if not pdf_bytes.lstrip()[:5] == FIRMA_PDF:
        raise FileFormatNotAllowedException("El archivo no es un PDF valido.")


async def pipeline(ficha: UploadFile, embedding_service: EmbeddingService) -> FichaResponse:
    """
    Pipeline completo de una ficha:
    validacion -> OCR -> extraccion -> normalizacion -> texto semantico -> embedding
    """

    # Obtener los bytes del pdf
    pdf_bytes: bytes = await ficha.read()

    _validar_pdf(ficha, pdf_bytes)

    # El OCR es una tarea pesada y sincrona: se ejecuta en un hilo aparte
    # para no bloquear el servidor mientras se procesa la ficha.

    try:
        datos_extraidos: Dict[str, str] = await run_in_threadpool(ejecutar_ocr_limpio, pdf_bytes)
    except FichaIlegibleException:
        raise
    except Exception as ex:
        logger.error(f"Error durante el OCR de '{ficha.filename}': {ex}", exc_info=True)
        raise FichaIlegibleException("No se pudo leer el contenido del PDF.") from ex

    datos: Dict[str, Any] = normalizar_datos(datos_extraidos)

    if not es_ficha_reconocible(datos):
        raise FichaIlegibleException(
            "No se reconocio el formato de ficha del RNPDNO o el documento es ilegible."
        ) 

    
    # Obtenemos el texto que vamos a vectorizar
    texto_semantico: str = embedding_service.construir_texto_semantico(datos)
    embedding_data: Optional[EmbeddingResponse] = None
    

    # Agregamos el embedding a la respuesta
    if texto_semantico:
        vector: list[float] = await run_in_threadpool(
            embedding_service.generar_embedding, texto_semantico
        )

        embedding_data = EmbeddingResponse(
            embedding=vector,
            dimension=embedding_service.obtener_dimension(),
            transformer_model=embedding_service.model_name
        )
    else:
        logger.warning(
            f"La ficha '{ficha.filename}' no tiene campos descriptivos; se devuelve sin embedding."
        )

    
    return FichaResponse(**datos, embedding_Data=embedding_data)
