import re
from re import Match
from typing import Optional, List, Any, Dict


def extraer_nombre(texto_crudo: str) -> str:
    """
    Extrae el nombre de la persona desaparecida.
    """

    nombre: str = "NO ENCONTRADO"

    # NUEVO INTENTO 1: Buscar justo debajo del encabezado principal (Limpieza estricta)
    match_nombre: Optional[Match] = re.search(
        r"PERSONA DESAPARECIDA\s*\n+([A-ZÑÁÉÍÓÚ\s]{5,})", 
        texto_crudo
    )
    
    if match_nombre:
        nombre_sucio: str = match_nombre.group(1).strip()
        primera_linea: str = nombre_sucio.split("\n")[0]
        # Limpieza estricta: Se limpian caracteres basura que el OCR suele confundir con bordes
        return re.sub(r"^[\s\|lI1]+", "", primera_linea).strip()

    # INTENTO 2 (Fallback): Buscar en bloque hasta Edad
    bloque_nombre: Optional[Match] = re.search(
        r"PERSONA DESAPARECIDA(.*?)Edad al momento",
        texto_crudo,
        re.DOTALL
    )

    if not bloque_nombre:
        return nombre

    lineas: List[str] = bloque_nombre.group(1).split("\n")

    for linea in lineas:

        match_nombre2: Optional[Match] = re.search(
            r"([A-ZÑÁÉÍÓÚ\s]{10,})",
            linea
        )

        if match_nombre2:

            nombre_limpio: str = match_nombre2.group(1).strip()

            if len(nombre_limpio.split()) >= 2:
                nombre = nombre_limpio
                break

    return nombre


def extraer_datos_simples(texto_crudo: str) -> Dict[str, str]:
    """
    Extrae los campos que pueden obtenerse mediante
    patrones simples de expresiones regulares.
    """

    patrones_simples: Dict[str, str] = {

        "Edad_Desaparicion":
            r"Edad al momento de la desaparición:\s*(\d+)",

        "Edad_Actual":
            r"Edad actual:\s*(\d+)",

        "Lugar_Nacimiento":
            r"Lugar de nacimiento:\s*([^\n]+)",

        "Sexo":
            r"Sexo:\s*([^\n]+)",

        "Nacionalidad":
            r"(?:Nacionalidad|lacionalidad):\s*([^\n]+)",

        "Habla_Espanol":
            r"¿Habla español\?:\s*([^\n]+)",

        "Lengua_Indigena":
            r"Idioma o lengua indígena:\s*([^\n]+)",

        "Discapacidad":
            r"(?:Discapacidad|iscapacidad):\s*([^\n]+)",

        "Fecha_Hechos":
            r"Fecha de hechos:\s*([^\n]+)",

        "Fecha_Percato":
            r"Fecha de percato:\s*([^\n]+)",

        "Autoridad_Reporte":
            r"Autoridad que ingresó el reporte:\s*([^\n]+)"
    }

    datos: Dict[str, str] = {}

    for clave, patron in patrones_simples.items():

        coincidencia: Optional[Match] = re.search(
            patron,
            texto_crudo,
            re.IGNORECASE
        )

        if coincidencia:
            datos[clave] = coincidencia.group(1).strip()
        else:
            datos[clave] = "SIN DATO"

    return datos


def extraer_lugar_hechos(
    texto_crudo: str
) -> tuple[str, str]:
    """
    Extrae el lugar de los hechos y lo separa
    en estado y municipio.

    Formato esperado:
    ESTADO, MUNICIPIO
    """

    coincidencia = re.search(
        r"Lugar de los hechos:\s*([^\n]+)",
        texto_crudo
    )

    if not coincidencia:
        return "SIN DATO", "SIN DATO"

    lugar_hechos: str = coincidencia.group(1).strip()

    return separar_lugar_hechos(lugar_hechos)



def separar_lugar_hechos(lugar_hechos: str) -> tuple[str, str]:
    """
    Separa el lugar de los hechos en estado y municipio.

    Formato esperado:
    ESTADO, MUNICIPIO
    """

    if lugar_hechos == "SIN DATO":
        return "SIN DATO", "SIN DATO"

    partes: list[str] = lugar_hechos.split(",", maxsplit=1)

    estado: str = partes[0].strip()

    municipio: str = (
        partes[1].strip()
        if len(partes) > 1
        else "SIN DATO"
    )

    return estado, municipio


def extraer_caracteristicas_fisicas(
    texto_crudo: str
) -> str:
    """
    Extrae las caracteristicas fisicas de la persona.
    """

    # Intentar capturar desde COMPLEX hasta PESO (Mejorado con lógicas de original.py)
    match_fisicas: Optional[Match] = re.search(
        r"((?:COMPLEX.*?|COLOR DE LA PIEL).*?PESO:.*?kg)",
        texto_crudo,
        re.DOTALL | re.IGNORECASE
    )

    if match_fisicas:
        texto_limpio: str = match_fisicas.group(1).replace("\n", " ").strip()
        # NUEVA LIMPIEZA: Borra los títulos colados y la barra
        texto_limpio = re.sub(r"(Características|f[ií]sicas:?|\|)", "", texto_limpio, flags=re.IGNORECASE)
        return re.sub(r"\s+", " ", texto_limpio).strip()

    # Fallback
    match_fisicas_alt: Optional[Match] = re.search(
        r"f[ií]sicas\s*[:;.]?[\s\|]*(.*?)(?=Se[nñ]as|particulares)",
        texto_crudo,
        re.DOTALL | re.IGNORECASE
    )

    if match_fisicas_alt:
        texto_limpio = match_fisicas_alt.group(1).replace("\n", " ").strip()
        texto_limpio = re.sub(r"^[\s\|lI1]+", "", texto_limpio)
        texto_limpio = re.sub(r"(Características|f[ií]sicas:?|\|)", "", texto_limpio, flags=re.IGNORECASE)
        texto_limpio = re.sub(r"\s+", " ", texto_limpio).strip()
        return texto_limpio if texto_limpio else "SIN DATO"

    return "SIN DATO"


def extraer_senas_particulares(
    texto_crudo: str
) -> str:
    """
    Extrae las señas particulares.
    """

    # Mejorado con el lookahead extendido de original.py para no capturar secciones incorrectas
    match_senas: Optional[Match] = re.search(
        r"PESO:.*?kg[\s\|\-_—]*(.*?)(?=PRENDA|vestir:|Prendas de|Autoridad|Competentes|DATOS|La\s*informaci[oó]n)",
        texto_crudo,
        re.DOTALL | re.IGNORECASE
    )

    if not match_senas:
        return "SIN DATO"

    texto_limpio: str = match_senas.group(1)
    
    texto_limpio = re.sub(r"(Se[nñ]as|particulares:?)", "", texto_limpio, flags=re.IGNORECASE)
    texto_limpio = re.sub(r"[\n\|]+", " ", texto_limpio)
    texto_limpio = re.sub(r"^[\s\|lI1\-_—]+", "", texto_limpio).strip()
    texto_limpio = re.sub(r"[\+,\.\s]+$", "", texto_limpio)
    
    # NUEVA LIMPIEZA: Eliminar alucinación de Tesseract "dio"
    texto_limpio = re.sub(r"\bdio\b", "", texto_limpio, flags=re.IGNORECASE).strip()
    
    texto_limpio = re.sub(r"\s+", " ", texto_limpio).strip()

    return texto_limpio if texto_limpio else "SIN DATO"


def extraer_prendas_vestir(
    texto_crudo: str
) -> str:
    """
    Extrae las prendas de vestir.
    """

    # Regex mejorada desde original.py
    match_prendas: Optional[Match] = re.search(
        r"(?:vestir:|Prendas de vestir:?|PRENDA DE VESTIR)[\s\|\-_—]*(.*?)(?=Autoridad|Competentes|DATOS|La\s*informaci[oó]n)",
        texto_crudo,
        re.DOTALL | re.IGNORECASE
    )

    if not match_prendas:
        return "SIN DATO"

    texto_limpio: str = match_prendas.group(1)
    
    texto_limpio = re.sub(r"[\n\|]+", " ", texto_limpio)
    texto_limpio = re.sub(r"^[\s\|lI1\-_—:]+", "", texto_limpio).strip()
    
    # NUEVA LIMPIEZA: Borra la palabra "vestir:" flotante si se coló
    texto_limpio = re.sub(r"\bvestir:\s*", "", texto_limpio, flags=re.IGNORECASE)
    
    if "SIN DATO" in texto_limpio.upper() or not texto_limpio:
        return "SIN DATO"

    return re.sub(r"\s+", " ", texto_limpio).strip()


def aplicar_correcciones(
    datos: Dict[str, str]
) -> Dict[str, str]:
    """
    Aplica correcciones específicas provocadas por errores
    frecuentes del OCR.
    """

    if datos.get("Habla_Espanol") == "S!":
        datos["Habla_Espanol"] = "SI"

    # Descartar capturas accidentales (basura de 1 o 2 caracteres)
    for clave in ["Discapacidad", "Lengua_Indigena"]:
        if clave in datos and len(datos[clave]) <= 2 and not datos[clave].isalnum():
            datos[clave] = "SIN DATO"

    return datos


def aplicar_fallback_tabla(
    texto_crudo: str,
    datos: Dict[str, str]
) -> Dict[str, str]:
    """
    Si la extracción de caracteristicas fisicas falla,
    intenta obtener la informacion directamente desde
    la tabla de datos.
    """

    if (
        "Caracteristicas_Fisicas" in datos
        and (
            datos["Caracteristicas_Fisicas"] == ""
            or datos["Caracteristicas_Fisicas"] == "O"
            or datos["Caracteristicas_Fisicas"] == "SIN DATO"
        )
    ):

        match_tabla = re.search(
            r"\|\s*DATOS\s*\n([^\n]+)\s*\n([^\n]+)\s*\n([^\n]+)",
            texto_crudo
        )

        if match_tabla:

            datos["Caracteristicas_Fisicas"] = (
                match_tabla.group(1)
                .replace("|", "")
                .strip()
            )

            datos["Senas_Particulares"] = (
                match_tabla.group(2)
                .replace("|", "")
                .strip()
            )

            datos["Prendas_Vestir"] = (
                match_tabla.group(3)
                .replace("|", "")
                .strip()
            )

    return datos


def extraer_datos_vitales(
    texto_crudo: str
) -> Dict[str, str]:
    """
    Extrae y estructura todos los datos relevantes
    encontrados en el texto obtenido mediante OCR.
    """

    datos: Dict[str, str] = {}

    # Nombre
    datos["Nombre"] = extraer_nombre(texto_crudo)

    # Datos simples
    datos.update(
        extraer_datos_simples(texto_crudo)
    )

    # Lugar de los hechos
    estado_hechos, municipio_hechos = extraer_lugar_hechos(
        texto_crudo
    )

    datos["Estado_Hechos"] = estado_hechos
    datos["Municipio_Hechos"] = municipio_hechos

    # Características físicas
    datos["Caracteristicas_Fisicas"] = (
        extraer_caracteristicas_fisicas(texto_crudo)
    )

    # Señas particulares
    datos["Senas_Particulares"] = (
        extraer_senas_particulares(texto_crudo)
    )

    # Prendas de vestir
    datos["Prendas_Vestir"] = (
        extraer_prendas_vestir(texto_crudo)
    )

    # Correcciones OCR
    datos = aplicar_correcciones(datos)

    # Fallback de tabla
    datos = aplicar_fallback_tabla(
        texto_crudo,
        datos
    )

    return datos