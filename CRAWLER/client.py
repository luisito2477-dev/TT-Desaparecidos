"""
Script para enviar los pdfs descargados por el crawler a ms-core
"""

import time
import requests
from pathlib import Path

# ================= CONFIGURACIÓN =================
URL_SERVIDOR = "http://localhost:8080/api/ms-core/archivos/upload" # Cambia esto por la URL de tu API
CARPETA_PDFS = r"C:\Users\luish\Documents\MISPROYECTOS\TT-DESAPARECIDOS\tests\dataset\JIMENEZ"                 # Ruta de la carpeta con los archivos
CANTIDAD_A_ENVIAR = 20                          # Número máximo de PDFs a enviar
DELAY_SEGUNDOS = 1                            # Tiempo de espera entre peticiones
# =================================================

def enviar_archivos(url, carpeta, limite, delay):
    ruta_carpeta = Path(carpeta)
    
    # Validar si la carpeta existe
    if not ruta_carpeta.is_dir():
        print(f"Error: La carpeta '{carpeta}' no existe.")
        return

    # Buscar solo archivos con extensión .pdf
    archivos_pdf = list(ruta_carpeta.glob("*.pdf"))
    
    if not archivos_pdf:
        print(f"No se encontraron archivos PDF en '{carpeta}'.")
        return

    # Aplicar el límite de archivos
    archivos_a_enviar = archivos_pdf[:limite]
    total_archivos = len(archivos_a_enviar)
    
    print(f"Se preparan {total_archivos} archivo(s) para enviar a {url}\n")

    peticiones_exitosas = 0
    peticiones_fallidas = 0

    for indice, archivo in enumerate(archivos_a_enviar, 1):
        print(f"[{indice}/{total_archivos}] Enviando '{archivo.name}'...")
        
        try:
            # Abrir archivo en modo binario
            with open(archivo, 'rb') as f:
                # El nombre de la llave 'file' debe coincidir con lo que espera tu backend
                # (por ejemplo, UploadFile en FastAPI o MultipartFile en Spring Boot)
                archivos_payload = {'file': (archivo.name, f, 'application/pdf')}
                respuesta = requests.post(url, files=archivos_payload)
            
            # Verificar si el código HTTP es de éxito (200 o 201)
            if respuesta.status_code in (200, 201):
                print(f"  ✅ Éxito (HTTP {respuesta.status_code})")
                peticiones_exitosas += 1
            else:
                print(f"  ❌ Fallo (HTTP {respuesta.status_code}) - {respuesta.text}")
                peticiones_fallidas += 1
                
        except requests.exceptions.RequestException as e:
            print(f"  ⚠️ Error de conexión: {e}")
            peticiones_fallidas += 1

        # Aplicar el delay solo si no es el último archivo
        if indice < total_archivos:
            print(f"  Esperando {delay} segundos...\n")
            time.sleep(delay)

    # Imprimir resumen final
    print("\n" + "="*30)
    print("📊 RESUMEN DE LA EJECUCIÓN")
    print("="*30)
    print(f"Total procesados: {total_archivos}")
    print(f"✅ Exitosos:      {peticiones_exitosas}")
    print(f"❌ Fallidos:      {peticiones_fallidas}")

if __name__ == "__main__":
    enviar_archivos(URL_SERVIDOR, CARPETA_PDFS, CANTIDAD_A_ENVIAR, DELAY_SEGUNDOS)