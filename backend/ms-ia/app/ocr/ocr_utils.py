from typing import List
from app.config.config import POPPLER_PATH, OCR_CONFIG
from PIL import Image
import os
from pdf2image import convert_from_path, convert_from_bytes
import pytesseract


def validar_pdf(ruta_pdf: str) -> bool:
    """
    Comprueba que el archivo PDF exista.
    """

    return os.path.exists(ruta_pdf)


def convertir_pdf_a_imagenes(pdf_bytes: bytes) -> List[Image.Image]:
    """
    Convierte cada pagina del PDF en una imagen.
    """

    return convert_from_bytes(
        pdf_bytes,
        poppler_path=POPPLER_PATH,
        dpi=400
    )


def ejecutar_ocr_pagina(imagen: Image.Image) -> str:
    """
    Ejecuta Tesseract OCR sobre una imagen.
    """

    imagen_grises: Image.Image = imagen.convert("L")

    texto_pagina: str = pytesseract.image_to_string(
        imagen_grises,
        lang="spa",
        config=OCR_CONFIG
    )

    return texto_pagina


def ejecutar_ocr(
    imagenes: List[Image.Image]
) -> str:
    """
    Ejecuta OCR sobre todas las paginas y junta
    el texto obtenido.
    """

    texto_total: str = ""

    for i, imagen in enumerate(imagenes):

        print(
            f"[*] Ejecutando OCR en la página {i + 1}..."
        )

        texto_pagina: str = ejecutar_ocr_pagina(
            imagen
        )

        texto_total += texto_pagina + "\n"

    return texto_total