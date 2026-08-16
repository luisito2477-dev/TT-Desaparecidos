from app.ocr.ocr_utils import *
from typing import Dict
from app.ocr.regex_utils import extraer_datos_vitales
import json


def ejecutar_ocr_limpio(pdf_bytes: bytes) -> Dict[str, str]:
    """
    Ejecuta todo el pipeline:

    PDF → imágenes → OCR → extracción → JSON
    """

    print("Iniciando procesamiento del archivo")

    

    # PDF → imágenes
    print("[*] Convirtiendo PDF a imágenes (DPI=400)...")

    imagenes: List[Image.Image] = (
        convertir_pdf_a_imagenes(pdf_bytes)
    )

    # OCR
    texto_total: str = ejecutar_ocr(imagenes)

    # Extraccion
    print("[*] Extrayendo y estructurando informacion.")

    datos_estructurados: Dict[str, str] = (extraer_datos_vitales(texto_total))

    # Resultado
    print("RESULTADO DE LA EXTRACCIÓN (JSON)")

    print(
        json.dumps(
            datos_estructurados,
            indent=4,
            ensure_ascii=False
        )
    )
    return datos_estructurados
