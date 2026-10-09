from pydantic import BaseModel, ConfigDict, Field, field_validator
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

    Nombre: Optional[str] = None
    Edad_Desaparicion: Optional[int] = None
    Edad_Actual: Optional[int] = None
    Lugar_Nacimiento: Optional[str] = None
    Sexo: Optional[str] = None
    Nacionalidad: Optional[str] = None
    Habla_Espanol: Optional[bool] = None
    Lengua_Indigena: Optional[str] = None
    Discapacidad: Optional[str] = None
    Fecha_Hechos: Optional[date] = None
    Fecha_Percato: Optional[date] = None
    Autoridad_Reporte: Optional[str] = None
    Estado_Hechos: Optional[str] = None
    Municipio_Hechos: Optional[str] = None
    Caracteristicas_Fisicas: Optional[str] = None
    Senas_Particulares: Optional[str] = None
    Prendas_Vestir: Optional[str] = None
    embedding_Data: Optional[EmbeddingResponse] = None


class EmbeddingCreate(BaseModel):
    """
    DTO que se usara para parsear el payload de la peticion
    en el endpoint /embedding
    """
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    texto_busqueda: str = Field(min_length=1, max_length=2000)

    @field_validator("texto_busqueda")
    @classmethod
    def no_vacio(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El texto de busqueda no puede estar vacio")
        return valor


class EmbeddingResponse(BaseModel):
    """
    DTO que se usa para parsear el payload de la respuesta del
    endpoint /embedding
    """
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    embedding: list[float]
    dimension: int
    transformer_model: str