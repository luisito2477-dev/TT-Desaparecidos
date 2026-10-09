from app.ocr.ocr_utils import *
from typing import Dict
from app.ocr.regex_utils import extraer_datos_vitales
import json
from logging import Logger, getLogger
from app.exception.exceptions import *

logger: Logger = getLogger(__name__)

def ejecutar_ocr_limpio(pdf_bytes: bytes) -> Dict[str, str]:
    """
    Ejecuta todo el pipeline:

    PDF → imágenes → OCR → extracción → JSON
    """

    logger.info("Convirtiendo PDF a imagenes...")

    imagenes: List[Image.Image] = (
        convertir_pdf_a_imagenes(pdf_bytes)
    )
    if not imagenes:
            raise FichaIlegibleException("El PDF no contiene paginas.")
    # OCR
    texto_total: str = ejecutar_ocr(imagenes)

    if not texto_total.strip():
        raise FichaIlegibleException("El OCR no detecto texto en el documento.")

    # Extraccion
    logger.info("Extrayendo y estructurando informacion...")

    datos_estructurados: Dict[str, str] = (extraer_datos_vitales(texto_total))

    # Resultado
    logger.debug(f"Datos extraidos: {datos_estructurados}")


    return datos_estructurados
