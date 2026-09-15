# Trabajo Terminal No. 2026
# Módulo: Ingesta de Datos y Reconocimiento Óptico de Caracteres (OCR)
# Autores: Díaz Torres Jonathan Samuel, Hernández Pérez Luis Fernando
# Descripción: Script para procesar fichas de búsqueda en PDF, extraer el texto
# mediante Tesseract y estructurar la información usando expresiones regulares.

import os
import re
import json
from pdf2image import convert_from_path
import pytesseract

# Configuración de binarios locales (Dependencias externas necesarias)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
ruta_poppler = r'C:\poppler\Library\bin'

def extraer_datos_vitales(texto_crudo):
    """
    Toma el texto bruto generado por el OCR y extrae los campos clave.
    Se apoya en expresiones regulares tolerantes a fallos típicos del OCR 
    (como confusión de caracteres y saltos de línea irregulares).
    
    Retorna:
        dict: Diccionario estructurado con los datos de la persona.
    """
    datos = {}
    
    # ---------------------------------------------------------
    # 1. NOMBRE (Limpieza estricta de saltos de línea)
    # ---------------------------------------------------------
    datos['Nombre'] = "NO ENCONTRADO"
    
   
    match_nombre = re.search(r'PERSONA DESAPARECIDA\s*\n+([A-ZÑÁÉÍÓÚ\s]{5,})', texto_crudo)
    
    if match_nombre:
        nombre_sucio = match_nombre.group(1).strip()
        primera_linea = nombre_sucio.split('\n')[0]
       
        datos['Nombre'] = re.sub(r'^[\s\|lI1]+', '', primera_linea).strip()
    else:
     
        bloque_nombre = re.search(r'PERSONA DESAPARECIDA(.*?)Edad al momento', texto_crudo, re.DOTALL)
        if bloque_nombre:
            for linea in bloque_nombre.group(1).split('\n'):
                m = re.search(r'([A-ZÑÁÉÍÓÚ\s]{10,})', linea)
                if m and len(m.group(1).split()) >= 2:
                    datos['Nombre'] = m.group(1).strip()
                    break

    # ---------------------------------------------------------
    # 2. PATRONES SIMPLES (Campos de una sola línea)
    # ---------------------------------------------------------
    patrones_simples = {
        'Edad_Desaparicion': r'Edad al momento de la desaparición:\s*(\d+)',
        'Edad_Actual': r'Edad actual:\s*(\d+)',
        'Lugar_Nacimiento': r'Lugar de nacimiento:\s*([^\n]+)',
        'Sexo': r'Sexo:\s*([^\n]+)',
        'Nacionalidad': r'(?:Nacionalidad|lacionalidad):\s*([^\n]+)',
        'Habla_Espanol': r'¿Habla español\?:\s*([^\n]+)',
        'Lengua_Indigena': r'Idioma o lengua indígena:\s*([^\n]+)',
        'Discapacidad': r'(?:Discapacidad|iscapacidad):\s*([^\n]+)',
        'Fecha_Hechos': r'Fecha de hechos:\s*([^\n]+)',
        'Fecha_Percato': r'Fecha de percato:\s*([^\n]+)',
        'Lugar_Hechos': r'Lugar de los hechos:\s*([^\n]+)',
        'Autoridad_Reporte': r'Autoridad que ingresó el reporte:\s*([^\n]+)'
    }

    # Búsqueda iterativa de los campos estandarizados
    for clave, patron in patrones_simples.items():
        coincidencia = re.search(patron, texto_crudo, re.IGNORECASE)
        datos[clave] = coincidencia.group(1).strip() if coincidencia else "SIN DATO"

    # Corrección específica de errores recurrentes del motor OCR
    if datos['Habla_Espanol'] == 'S!':
        datos['Habla_Espanol'] = 'SI'

    # Descartar capturas accidentales (basura de 1 o 2 caracteres)
    for clave in ['Discapacidad', 'Lengua_Indigena']:
        if len(datos[clave]) <= 2 and not datos[clave].isalnum():
            datos[clave] = "SIN DATO"

    # ---------------------------------------------------------
    # 3. CARACTERÍSTICAS FÍSICAS (Extracción multilínea)
    # ---------------------------------------------------------
    # Captura el bloque completo desde COMPLEX/COLOR hasta el PESO
    match_fisicas = re.search(r'((?:COMPLEX.*?|COLOR DE LA PIEL).*?PESO:.*?kg)', texto_crudo, re.DOTALL | re.IGNORECASE)
    if match_fisicas:
        txt = match_fisicas.group(1).replace('\n', ' ').strip()
        # NUEVA LIMPIEZA: Borra los títulos colados y la barra
        txt = re.sub(r'(Características|f[ií]sicas:?|\|)', '', txt, flags=re.IGNORECASE)
        datos['Caracteristicas_Fisicas'] = re.sub(r'\s+', ' ', txt).strip()
    else:
        # Fallback en caso de que la estructura cambie
        match_fisicas_alt = re.search(r'f[ií]sicas\s*[:;.]?[\s\|]*(.*?)(?=Se[nñ]as|particulares)', texto_crudo, re.DOTALL | re.IGNORECASE)
        if match_fisicas_alt:
            txt = re.sub(r'^[\s\|lI1]+', '', match_fisicas_alt.group(1)).replace('\n', ' ').strip()
            txt = re.sub(r'(Características|f[ií]sicas:?|\|)', '', txt, flags=re.IGNORECASE)
            datos['Caracteristicas_Fisicas'] = txt if txt else "SIN DATO"
        else:
            datos['Caracteristicas_Fisicas'] = "SIN DATO"

    # ---------------------------------------------------------
    # 4. SEÑAS PARTICULARES 
    # ---------------------------------------------------------
    # Utiliza lookaheads (?=...) para detener la captura al encontrar la siguiente sección
    match_senas = re.search(r'PESO:.*?kg[\s\|\-_—]*(.*?)(?=PRENDA|vestir:|Prendas de|Autoridad|Competentes|DATOS|La\s*informaci[oó]n)', texto_crudo, re.DOTALL | re.IGNORECASE)
    if match_senas:
        txt = match_senas.group(1)
        txt = re.sub(r'(Se[nñ]as|particulares:?)', '', txt, flags=re.IGNORECASE)
        txt = re.sub(r'[\n\|]+', ' ', txt)
        txt = re.sub(r'^[\s\|lI1\-_—]+', '', txt).strip()
        txt = re.sub(r'[\+,\.\s]+$', '', txt)
        
       
        txt = re.sub(r'\bdio\b', '', txt, flags=re.IGNORECASE).strip()
        
        datos['Senas_Particulares'] = re.sub(r'\s+', ' ', txt) if txt else "SIN DATO"
    else:
        datos['Senas_Particulares'] = "SIN DATO"
        
    # ---------------------------------------------------------
    # 5. PRENDAS DE VESTIR 
    # ---------------------------------------------------------
    match_prendas = re.search(r'(?:vestir:|Prendas de vestir:?|PRENDA DE VESTIR)[\s\|\-_—]*(.*?)(?=Autoridad|Competentes|DATOS|La\s*informaci[oó]n)', texto_crudo, re.DOTALL | re.IGNORECASE)
    if match_prendas:
        txt = match_prendas.group(1)
        txt = re.sub(r'[\n\|]+', ' ', txt)
        txt = re.sub(r'^[\s\|lI1\-_—:]+', '', txt).strip()
        
       
        txt = re.sub(r'\bvestir:\s*', '', txt, flags=re.IGNORECASE)
        
        datos['Prendas_Vestir'] = "SIN DATO" if "SIN DATO" in txt.upper() or not txt else re.sub(r'\s+', ' ', txt).strip()
    else:
        datos['Prendas_Vestir'] = "SIN DATO"

    return datos


def ejecutar_ocr_limpio(ruta_pdf):
    """
    Función orquestadora: 
    Lee un documento PDF, lo rasteriza a imágenes de alta calidad (400 DPI)
    y ejecuta el motor Tesseract OCR para recuperar el texto.
    """
    print(f"[*] Iniciando procesamiento del archivo: {ruta_pdf}")
    if not os.path.exists(ruta_pdf):
        print("Error: El archivo PDF no existe.")
        return

    # Se usa 400 DPI para garantizar mejor reconocimiento en textos pequeños o comprimidos
    print("[*] Convirtiendo PDF a imágenes (DPI=400)...")
    imagenes = convert_from_path(ruta_pdf, poppler_path=ruta_poppler, dpi=400)
    
    texto_total = ""
    # Configuración de Tesseract: 
    # --oem 3 (Default LSTM engine) / --psm 3 (Fully automatic page segmentation)
    config_tesseract = r'--oem 3 --psm 3'
    
    for i, imagen in enumerate(imagenes):
        print(f"[*] Ejecutando OCR en la página {i + 1}...")
        # Convertir a escala de grises ('L') mejora el contraste para el OCR
        imagen_grises = imagen.convert('L')
        texto_pagina = pytesseract.image_to_string(imagen_grises, lang='spa', config=config_tesseract)
        texto_total += texto_pagina + "\n"

    print("[*] Extrayendo y estructurando información.")
    datos = extraer_datos_vitales(texto_total)

    print("\nRESULTADO DE LA EXTRACCIÓN (JSON)")
    print(json.dumps(datos, indent=4, ensure_ascii=False))


if __name__ == '__main__':
    ejecutar_ocr_limpio('JIMENEZ_100.pdf')