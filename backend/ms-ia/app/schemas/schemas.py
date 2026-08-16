from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional, Final
from enum import Enum
from datetime import date


""" class Genero(Enum):
    
    Enum para gestionar los generos
    
    HOMBRE: Final[str] = "HOMBRE"
    MUJER: Final[str] = "MUJER" """


class FichaResponse(BaseModel):
    """
    DTO que se usara como respuesta en el endpoint /extraer-datos
    """
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    Nombre: str
    Edad_Desaparicion: str
    Edad_Actual: str
    Lugar_Nacimiento: str
    Sexo: str
    Nacionalidad: str
    Habla_Espanol: str
    Lengua_Indigena: str
    Discapacidad: str
    Fecha_Hechos: str
    Fecha_Percato: str
    Lugar_Hechos: str
    Autoridad_Reporte: str
    Caracteristicas_Fisicas: str
    Senas_Particulares: str
    Prendas_Vestir: str


class EmbeddingCreate(BaseModel):
    """
    DTO que se usara para parsear el payload de la peticion
    en el endpoint /embedding
    """
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    texto_busqueda: str


class EmbeddingResponse(BaseModel):
    """
    DTO que se usa para parsear el payload de la respuesta del
    endpoint /embedding
    """
    embedding: list[float]
    dimension: int