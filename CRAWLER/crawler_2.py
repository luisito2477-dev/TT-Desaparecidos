# Trabajo Terminal No. 2026
# Módulo: Ingesta Automatizada de Datos (Web Scraper Dinámico)
# Autores: Díaz Torres Jonathan Samuel, Hernández Pérez Luis Fernando
# Descripción: Script de automatización con Playwright para extraer expedientes (PDFs)
# del portal RNPDNO. Maneja asincronía, burla el DOM virtual (Vue.js) y controla 
# modales superpuestos mediante inyección de JavaScript y selectores visuales.
import time
import os
import unicodedata
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
# Configuración global
LIMITE_DESCARGAS = 100
RUTA_BASE = r"C:\Users\Lenovo\Downloads\CRAWLER"
def normalizar_apellido(texto):
    """
    Limpia el input del usuario eliminando acentos y convirtiendo a mayúsculas
    para evitar errores de codificación en las búsquedas del portal.
    """
    texto = texto.upper().strip()
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    return texto
def iniciar_ingesta_dinamica():
    """
    Función orquestadora del Crawler.
    Levanta un entorno de navegador real para interactuar con la SPA (Single Page Application)
    del gobierno, despachando eventos a bajo nivel y descargando archivos de forma asíncrona.
    """
    print("Iniciando módulo de ingesta RNPDNO...")
    os.makedirs(RUTA_BASE, exist_ok=True)
    
    apellido_crudo = input("Ingrese el apellido paterno a buscar: ")
    if not apellido_crudo:
        return
    apellido_objetivo = normalizar_apellido(apellido_crudo)
    nombre_carpeta = apellido_objetivo.strip()
    carpeta_destino = os.path.join(RUTA_BASE, nombre_carpeta)
    os.makedirs(carpeta_destino, exist_ok=True)
    
    # Retoma descargas previas si la carpeta ya existe para no sobreescribir
    archivos_existentes = len([f for f in os.listdir(carpeta_destino) if f.endswith('.pdf')])
    
    with sync_playwright() as p:
        # Se lanza el navegador con evasión de traductor nativo
        browser = p.chromium.launch(
            headless=False, 
            args=['--start-maximized', '--disable-features=Translate']
        ) 
        context = browser.new_context(
            accept_downloads=True,
            no_viewport=True, 
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        try:
            print("Conectando al portal...")
            page.goto("https://consultapublicarnpdno.segob.gob.mx/consulta", timeout=60000)
            page.wait_for_load_state("networkidle") # Espera a que el framework frontend termine de cargar
            
            print(f"Ejecutando búsqueda para: {apellido_objetivo}")
            caja_busqueda = page.locator("input[name='folio_nombre']")
            caja_busqueda.click()
            caja_busqueda.focus()
            caja_busqueda.type(apellido_objetivo, delay=100) 
            
            # CRÍTICO: Se disparan eventos nativos para forzar la actualización del estado 
            # reactivo en Vue.js/React. Sin esto, el framework ignora el texto ingresado.
            caja_busqueda.dispatch_event("input")
            caja_busqueda.dispatch_event("change")
            time.sleep(1.0)
            
            caja_busqueda.press("Enter")
            
            # Click de respaldo en el icono de la lupa
            btn_lupa = page.locator("i.pi-search.white-icon").first
            try: btn_lupa.click(force=True)
            except: pass
            
            print("Esperando respuesta del servidor...")
            time.sleep(5.0) 
            
            descargados = 0
            pagina_actual = 1
            
            while descargados < LIMITE_DESCARGAS:
                print(f"\n--- Procesando página {pagina_actual} ---")
                
                # Selector dinámico: Ante la falta de IDs, se identifica el botón de expansión
                # mediante la cadena Base64 de la imagen renderizada.
                selector_flecha_exacta = 'img[src*="iVBORw0KGgoAAAANSUhEUgAAACkAAAAp"]'
                
                try:
                    page.wait_for_selector(selector_flecha_exacta, state="visible", timeout=20000)
                except PlaywrightTimeoutError:
                    print("No se encontraron más resultados.")
                    break
                
                time.sleep(2.0)
                
                flechas = page.locator(selector_flecha_exacta).filter(visible=True)
                total_expedientes = flechas.count()
                
                print(f"Expedientes en vista: {total_expedientes}")
                for i in range(total_expedientes):
                    if descargados >= LIMITE_DESCARGAS:
                        break
                    print(f"Extrayendo expediente {i + 1}/{total_expedientes}...")
                    
                    flecha = flechas.nth(i)
                    flecha.scroll_into_view_if_needed()
                    time.sleep(0.5)
                    
                    flecha.click(force=True) # Abre el modal del expediente
                    
                    # Espera a que el modal emergente termine de renderizarse
                    try:
                        page.wait_for_selector("h5:has-text('Descargar PDF')", state="visible", timeout=8000)
                    except PlaywrightTimeoutError:
                        print("  -> Botón de descarga no encontrado. Omitiendo...")
                        try: page.locator('img[alt="Cerrar"]').filter(visible=True).first.click(force=True)
                        except: pass
                        page.keyboard.press("Escape")
                        time.sleep(1)
                        continue
                        
                    time.sleep(1.5) 
                    
                    # Captura del stream de descarga
                    try:
                        with page.expect_download(timeout=15000) as download_info:
                            # Inyección JS profunda para saltar bloqueos del DOM superpuesto
                            page.evaluate("""() => {
                                const botones = Array.from(document.querySelectorAll('h5'));
                                const btn = botones.find(b => b.innerText.includes('Descargar PDF') && b.offsetParent !== null);
                                if (btn) {
                                    btn.click();
                                }
                            }""")
                        
                        download = download_info.value
                        num = archivos_existentes + descargados + 1
                        nombre_archivo = f"{nombre_carpeta}_{num:03d}.pdf"
                        download.save_as(os.path.join(carpeta_destino, nombre_archivo))
                        descargados += 1
                        print(f"  -> Guardado: {nombre_archivo}")
                    except Exception as e:
                        print("  -> Error durante la descarga del PDF.")
                    # Lógica de estabilización: Forzar cierre del modal para evitar bloqueos
                    try:
                        btn_cerrar = page.locator('img[alt="Cerrar"]').filter(visible=True)
                        if btn_cerrar.count() > 0:
                            btn_cerrar.first.click(force=True)
                    except:
                        pass
                        
                    page.keyboard.press("Escape")
                    
                    try:
                        page.wait_for_selector("h5:has-text('Descargar PDF')", state="hidden", timeout=4000)
                    except:
                        # Fallback extremo: click en un área vacía (coordenadas 10,10) para perder el foco del modal
                        page.mouse.click(10, 10) 
                        time.sleep(1)
                        
                    time.sleep(0.5)
                if descargados >= LIMITE_DESCARGAS:
                    break
                
                # Búsqueda del botón de paginación mediante el trazado matemático del vector (SVG path)
                btn_siguiente = page.locator('svg:has(path[d^="M5.25 11.1728"])').first
                if btn_siguiente.is_visible():
                    print("Navegando a la siguiente página...")
                    btn_siguiente.locator("..").click(force=True)
                    pagina_actual += 1
                    time.sleep(5.0) 
                else:
                    print("Fin de la paginación.")
                    break
        except Exception as e:
            print(f"Error en la ejecución: {e}")
        finally:
            print(f"Proceso finalizado. Total descargado: {descargados}")
            browser.close()
if __name__ == '__main__':
    iniciar_ingesta_dinamica()