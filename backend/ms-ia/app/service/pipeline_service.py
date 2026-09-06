from app.service.ocr_service import ejecutar_ocr_limpio
from typing import Dict, Final, Any
from fastapi import UploadFile
from app.exception.exceptions import (
    FileFormatNotAllowedException
)
from app.service.nlp_service import EmbeddingService

from app.models.models import Embedding
from sqlalchemy.orm import Session
from app.schemas.schemas import FichaResponse
from app.config.config import TRANSFORMER_MODEL

async def pipeline(ficha: UploadFile, embedding_service: EmbeddingService, db: Session) -> FichaResponse:
    

    # Validacion del tipo de archivo
    allowed_types: Final[list[str]] = ["application/pdf"]
    if ficha.content_type not in allowed_types:
        raise FileFormatNotAllowedException("Formato del archivo no permitido") 

    # Obtener los bytes del pdf
    pdf_bytes: bytes = await ficha.read()

    # Ejecutar el OCR y obtener los datos
    datos_estructurados: Dict[str, str] = ejecutar_ocr_limpio(pdf_bytes)

    
    # Obtenemos el texto que vamos a vectorizar
    texto_a_convertir: str = embedding_service.construir_texto_semantico(datos_estructurados)

    # Realizar el embedding
    texto_embedded: list[float] = embedding_service.generar_embedding(texto_a_convertir)

    # Agregamos el embedding a la respuesta
    datos_estructurados["embedding_Data"]: Dict[str, Any] = {
        "embedding": texto_embedded,
        "dimension": embedding_service.obtener_dimension(),
        "modelo": TRANSFORMER_MODEL
    }


    #--CODIGO PARA INSERTAR EN BASE DE DATOS
    # Insertar en la base de datos
    # NOTA: Hay que checar como conseguimos la ficha_id para que el embedding quede enlazado con la ficha a
    # la que pertenece, por ahora se usara un ficha_id random jaja

#    random_ficha_id: Final[str] = "a2f1a32d-8c98-4a75-920d-56d5dde29b85"
 #   new_embedding: Embedding = Embedding(
  #      ficha_id=random_ficha_id,
   #     vector=texto_embedded
#    )

 #   db.add(new_embedding)
  #  db.commit()
   # db.refresh(new_embedding)
    
    print("--DATOS ANTES DE FICHA RESPONSE--")
    print(datos_estructurados)
    return FichaResponse(**datos_estructurados)
