"""
Normalizacion de los datos extraidos por OCR antes de enviarlos a MS-Core.

La extraccion por expresiones regulares (regex_utils) devuelve todo como texto
y usa "SIN DATO" / "NO ENCONTRADO" cuando no encuentra un campo. Este modulo
convierte ese resultado al contrato tipado que espera MS-Core:
  - valores faltantes  -> None
  - edades             -> int
  - fechas             -> datetime.date
  - habla espanol      -> bool
"""
import re
from datetime import date, datetime
from typing import Any, Dict, Optional

VALORES_VACIOS = {"", "SIN DATO", "NO ENCONTRADO", "NO DISPONIBLE", "N/A", "NA", "-", "--"}

CAMPOS_TEXTO = [
    "Nombre", "Lugar_Nacimiento", "Sexo", "Nacionalidad", "Lengua_Indigena",
    "Discapacidad", "Autoridad_Reporte", "Estado_Hechos", "Municipio_Hechos",
    "Caracteristicas_Fisicas", "Senas_Particulares", "Prendas_Vestir",
]
CAMPOS_EDAD = ["Edad_Desaparicion", "Edad_Actual"]
CAMPOS_FECHA = ["Fecha_Hechos", "Fecha_Percato"]
CAMPOS_DESCRIPTIVOS = ["Caracteristicas_Fisicas", "Senas_Particulares", "Prendas_Vestir"]

_PATRON_FECHA = re.compile(r"(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{4})")
_PATRON_FECHA_ISO = re.compile(r"(\d{4})-(\d{1,2})-(\d{1,2})")


def limpiar_texto(valor: Any) -> Optional[str]:
    """Quita espacios repetidos y convierte los marcadores de 'sin dato' en None."""
    if valor is None:
        return None
    texto = re.sub(r"\s+", " ", str(valor)).strip()
    if texto.upper().strip(" .:") in VALORES_VACIOS:
        return None
    return texto


def a_entero(valor: Any) -> Optional[int]:
    """Obtiene el primer numero del texto (p. ej. '25 años' -> 25)."""
    texto = limpiar_texto(valor)
    if texto is None:
        return None
    coincidencia = re.search(r"\d{1,3}", texto)
    return int(coincidencia.group()) if coincidencia else None


def a_fecha(valor: Any) -> Optional[date]:
    """
    Convierte la fecha de la ficha (dd/mm/aaaa) a un objeto date.
    Tolera separadores '-' o '.', y ruido del OCR alrededor de la fecha.
    """
    texto = limpiar_texto(valor)
    if texto is None:
        return None
    try:
        coincidencia = _PATRON_FECHA.search(texto)
        if coincidencia:
            dia, mes, anio = (int(g) for g in coincidencia.groups())
            return date(anio, mes, dia)
        coincidencia = _PATRON_FECHA_ISO.search(texto)
        if coincidencia:
            anio, mes, dia = (int(g) for g in coincidencia.groups())
            return date(anio, mes, dia)
    except ValueError:
        # Fecha imposible (p. ej. 31/02/2024) por error de OCR
        return None
    return None


def a_booleano(valor: Any) -> Optional[bool]:
    """Convierte 'SI' / 'NO' (con variantes del OCR) a booleano."""
    texto = limpiar_texto(valor)
    if texto is None:
        return None
    texto = texto.upper().replace("Í", "I").strip(" .:!")
    if texto in {"SI", "S", "S!", "5I", "SÍ"}:
        return True
    if texto in {"NO", "N", "N0"}:
        return False
    return None


def normalizar_datos(datos: Dict[str, Any]) -> Dict[str, Any]:
    """Aplica la normalizacion a todos los campos de la ficha."""
    normalizados: Dict[str, Any] = {}

    for campo in CAMPOS_TEXTO:
        normalizados[campo] = limpiar_texto(datos.get(campo))

    if normalizados.get("Sexo"):
        normalizados["Sexo"] = normalizados["Sexo"].upper()

    for campo in CAMPOS_EDAD:
        normalizados[campo] = a_entero(datos.get(campo))

    for campo in CAMPOS_FECHA:
        normalizados[campo] = a_fecha(datos.get(campo))

    normalizados["Habla_Espanol"] = a_booleano(datos.get("Habla_Espanol"))

    return normalizados


def es_ficha_reconocible(datos_normalizados: Dict[str, Any]) -> bool:
    """
    Indica si el documento parece una ficha del RNPDNO.
    Si no se pudo extraer ni el nombre ni ningun campo descriptivo,
    el documento no tiene el formato esperado o es ilegible.
    """
    if datos_normalizados.get("Nombre"):
        return True
    return any(datos_normalizados.get(c) for c in CAMPOS_DESCRIPTIVOS)
