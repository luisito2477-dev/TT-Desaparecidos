import time
import os
import re
import sys
import csv
import base64
import unicodedata
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

LIMITE_DESCARGAS = 0
RUTA_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fichas")
ARCHIVO_METRICAS = os.path.join(RUTA_BASE, "metricas_crawler.csv")
CAMPOS_METRICAS = ["corrida", "apellido", "evento", "indice", "pagina", "hora_inicio",
                   "t_proceso_s", "t_total_s", "t_desde_inicio_s", "resultado", "bytes",
                   "descargados_acum", "intentos_busqueda"]
NOMBRE_AVANCE = "_avance.txt"
NOMBRE_REGISTRO = "_registro_fichas.csv"
TAMANO_FICHA_VACIA = 503500
TIMEOUT_DATOS_MS = 6000
INTENTOS_DATOS = 3
TIMEOUT_DESCARGA_MS = 30000
PAUSA_ENTRE_FICHAS_S = 0.5
FALLAS_SEGUIDAS_MAX = 3
PAUSA_SATURACION_S = 30
TIMEOUT_PAGINA_S = 60
HEADLESS = False
PNG_VACIO = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/58BAwAI/AL+hc2rNAAAAABJRU5ErkJggg==")
SELECTOR_FLECHA = 'img[src*="iVBORw0KGgoAAAANSUhEUgAAACkAAAAp"]'
RE_GUID = re.compile(r"[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}", re.I)
JS_ES_CONFIDENCIAL = """e => {
    const card = e.closest('.ctn-card-consulta');
    const enlace = e.closest('a');
    return !!(card && card.querySelector('.texto-card-confidencial'))
        || !!(enlace && enlace.getAttribute('data-bs-target') === '#modalConfidencial');
}"""


def normalizar_apellido(texto):
    texto = texto.upper().strip()
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    return texto


def resultados_son_del_apellido(page, apellido):
    textos = page.locator("div.margin-col").all_inner_texts()
    nombres = [t.strip().split("\n")[0] for t in textos if not t.strip().startswith("CONFIDENCIAL")]
    if not textos:
        return False
    return all(apellido in normalizar_apellido(n) for n in nombres)


def esperar_resultados_del_apellido(page, apellido, timeout=30):
    inicio = time.time()
    estables = 0
    while time.time() - inicio < timeout:
        time.sleep(1.0)
        estables = estables + 1 if resultados_son_del_apellido(page, apellido) else 0
        if estables >= 3:
            return True
    return False


def firma_pagina(page):
    return "|".join(page.locator("div.margin-col").all_inner_texts())


def siguiente_pagina(page):
    btn_siguiente = page.locator('svg:has(path[d^="M5.25 11.1728"])').first
    if not btn_siguiente.is_visible():
        return "fin"
    firma = firma_pagina(page)
    btn_siguiente.locator("..").click(force=True)
    def pagina_nueva():
        actual = firma_pagina(page)
        return actual != firma and actual.strip() != ""
    inicio = time.time()
    while not pagina_nueva() and time.time() - inicio < TIMEOUT_PAGINA_S:
        time.sleep(0.5)
    if not pagina_nueva():
        return "no_cargo"
    time.sleep(0.5)
    return "ok"


def leer_avance(ruta):
    try:
        with open(ruta, encoding="utf-8") as f:
            return int(f.read().strip() or 1)
    except (OSError, ValueError):
        return 1


def guardar_avance(ruta, pagina):
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(str(pagina))


def registrar_metrica(archivo, fila):
    nuevo = not os.path.exists(archivo)
    with open(archivo, "a", newline="", encoding="utf-8") as f:
        escritor = csv.DictWriter(f, fieldnames=CAMPOS_METRICAS)
        if nuevo:
            escritor.writeheader()
        escritor.writerow(fila)


def leer_registro(ruta):
    if not os.path.exists(ruta):
        return set()
    with open(ruta, newline="", encoding="utf-8") as f:
        return {fila["clave"] for fila in csv.DictReader(f)}


def anotar_registro(ruta, clave, archivo, tamano):
    nuevo = not os.path.exists(ruta)
    with open(ruta, "a", newline="", encoding="utf-8") as f:
        escritor = csv.writer(f)
        if nuevo:
            escritor.writerow(["clave", "archivo", "bytes", "fecha"])
        escritor.writerow([clave, archivo, tamano, datetime.now().isoformat(timespec="seconds")])


def cerrar_modal(page):
    try:
        btn_cerrar = page.locator('img[alt="Cerrar"]').filter(visible=True)
        if btn_cerrar.count() > 0:
            btn_cerrar.first.click(force=True, timeout=2000)
    except Exception:
        pass
    page.keyboard.press("Escape")
    try:
        page.wait_for_selector("h5:has-text('Descargar PDF')", state="hidden", timeout=3000)
    except PlaywrightTimeoutError:
        page.mouse.click(10, 10)
        time.sleep(0.5)


def es_respuesta_de_datos(r):
    return "/api/pdf/" in r.url


def abrir_reporte(page, flecha, n_reporte):
    modal = radios = None

    def abrir():
        nonlocal modal, radios
        flecha.scroll_into_view_if_needed()
        flecha.click(force=True)
        modal = page.locator("div.p-dialog").filter(visible=True).last
        radios = modal.locator("ul.list-group input.form-check-input")
        try:
            radios.first.wait_for(state="visible", timeout=TIMEOUT_DATOS_MS)
            return True
        except PlaywrightTimeoutError:
            return False

    for intento in range(1, INTENTOS_DATOS + 1):
        try:
            if n_reporte == 0:
                with page.expect_response(es_respuesta_de_datos, timeout=TIMEOUT_DATOS_MS):
                    if not abrir():
                        return modal, radios, "sin_reportes"
                    radios.first.check(force=True)
            else:
                if not abrir() or n_reporte >= radios.count():
                    return modal, radios, "sin_reportes"
                with page.expect_response(es_respuesta_de_datos, timeout=TIMEOUT_DATOS_MS):
                    radios.nth(n_reporte).evaluate("e => e.click()")
            return modal, radios, "ok"
        except PlaywrightTimeoutError:
            print(f"  -> El servidor no entregó los datos en {TIMEOUT_DATOS_MS // 1000} s "
                  f"(intento {intento}/{INTENTOS_DATOS}).")
            cerrar_modal(page)
            time.sleep(2)
        except Exception as e:
            print(f"  -> Error al abrir la ficha: {str(e).splitlines()[0]}")
            return modal, radios, "error_ficha"
    return modal, radios, "sin_datos"


def iniciar_ingesta_dinamica(apellido_crudo=None, limite=LIMITE_DESCARGAS, ruta_base=RUTA_BASE,
                             corrida=None, archivo_metricas=ARCHIVO_METRICAS, omitir_repetidas=True):
    print("Iniciando módulo de ingesta RNPDNO...")
    os.makedirs(ruta_base, exist_ok=True)

    if apellido_crudo is None:
        apellido_crudo = input("Ingrese el apellido paterno a buscar: ")
    if not apellido_crudo:
        return
    sin_limite = not limite

    apellido_objetivo = normalizar_apellido(apellido_crudo)
    nombre_carpeta = apellido_objetivo.strip()
    carpeta_destino = os.path.join(ruta_base, nombre_carpeta)
    ruta_registro = os.path.join(ruta_base, NOMBRE_REGISTRO)
    ruta_avance = os.path.join(carpeta_destino, NOMBRE_AVANCE)
    if corrida is None:
        corrida = f"{nombre_carpeta}-{datetime.now():%Y%m%d-%H%M%S}"
    t_corrida = time.time()

    def metrica(evento, t_inicio, resultado, indice="", pagina="", t_proceso=None, tamano="", intentos=""):
        ahora = time.time()
        registrar_metrica(archivo_metricas, {
            "corrida": corrida, "apellido": nombre_carpeta, "evento": evento, "indice": indice,
            "pagina": pagina, "hora_inicio": datetime.fromtimestamp(t_inicio).isoformat(timespec="seconds"),
            "t_proceso_s": "" if t_proceso is None else round(t_proceso, 2),
            "t_total_s": round(ahora - t_inicio, 2), "t_desde_inicio_s": round(ahora - t_corrida, 2),
            "resultado": resultado, "bytes": tamano, "descargados_acum": descargados,
            "intentos_busqueda": intentos,
        })
    os.makedirs(carpeta_destino, exist_ok=True)

    ya_descargadas = leer_registro(ruta_registro) if omitir_repetidas else set()
    numeros = [int(m.group(1)) for f in os.listdir(carpeta_destino)
               if (m := re.fullmatch(rf"{re.escape(nombre_carpeta)}_(\d+)\.pdf", f))]
    siguiente_num = max(numeros, default=0) + 1
    if ya_descargadas:
        print(f"{len(ya_descargadas)} fichas ya descargadas antes; se omitirán.")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=HEADLESS,
            args=['--start-maximized', '--disable-features=Translate']
        )
        context = browser.new_context(
            accept_downloads=True,
            ignore_https_errors=True,
            no_viewport=True,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.route("**/null", lambda route: route.fulfill(status=200, content_type="image/png", body=PNG_VACIO))
        descargados = 0

        def limite_alcanzado():
            return not sin_limite and descargados >= limite

        try:
            print("Conectando al portal...")
            page.goto("https://consultapublicarnpdno.segob.gob.mx/consulta", timeout=90000, wait_until="domcontentloaded")
            page.wait_for_selector("input[name='folio_nombre']", state="visible", timeout=60000)

            print("Esperando la carga inicial del portal...")
            try:
                page.wait_for_selector(SELECTOR_FLECHA, state="visible", timeout=60000)
            except PlaywrightTimeoutError:
                pass
            time.sleep(1.0)

            caja_busqueda = page.locator("input[name='folio_nombre']")
            btn_lupa = page.locator("div.btn-searchFolio").first
            busqueda_ok = False
            intento = 0
            for intento in range(1, 4):
                print(f"Ejecutando búsqueda para: {apellido_objetivo} (intento {intento})")
                caja_busqueda.click()
                caja_busqueda.fill("")
                caja_busqueda.type(apellido_objetivo, delay=50)
                time.sleep(0.5)
                btn_lupa.click(force=True)

                print("Esperando respuesta del servidor...")
                if esperar_resultados_del_apellido(page, apellido_objetivo):
                    busqueda_ok = True
                    break
                print("  -> Los resultados no corresponden al apellido. Reintentando...")

            if not busqueda_ok:
                metrica("inicializacion", t_corrida, "fallo_busqueda", intentos=intento)
                print("No se pudo aplicar la búsqueda del apellido. Abortando para no descargar fichas ajenas.")
                return
            metrica("inicializacion", t_corrida, "ok", intentos=intento)

            pagina_actual = 1
            pagina_avance = leer_avance(ruta_avance) - 1 if omitir_repetidas else 1
            if pagina_avance > 1:
                print(f"Retomando: avanzando directo a la página {pagina_avance}...")
                while pagina_actual < pagina_avance:
                    if siguiente_pagina(page) != "ok":
                        print(f"  -> No se pudo avanzar más allá de la página {pagina_actual}; se sigue desde ahí.")
                        break
                    pagina_actual += 1
            intentadas = 0
            fallas_seguidas = 0

            def contar_falla(fallo):
                nonlocal fallas_seguidas
                fallas_seguidas = fallas_seguidas + 1 if fallo else 0
                if fallas_seguidas >= FALLAS_SEGUIDAS_MAX:
                    print(f"  -> {fallas_seguidas} fichas seguidas sin respuesta; el servidor parece saturado. "
                          f"Pausa de {PAUSA_SATURACION_S} s...")
                    time.sleep(PAUSA_SATURACION_S)
                    fallas_seguidas = 0

            while not limite_alcanzado():
                print(f"\n--- Procesando página {pagina_actual} ---")
                if omitir_repetidas:
                    guardar_avance(ruta_avance, pagina_actual)

                try:
                    page.wait_for_selector(SELECTOR_FLECHA, state="visible", timeout=TIMEOUT_PAGINA_S * 1000)
                except PlaywrightTimeoutError:
                    print("No se encontraron más resultados.")
                    break

                flechas = page.locator(SELECTOR_FLECHA).filter(visible=True)
                total_expedientes = flechas.count()
                print(f"Expedientes en vista: {total_expedientes}")

                for i in range(total_expedientes):
                    if limite_alcanzado():
                        break
                    flecha = flechas.nth(i)

                    if flecha.evaluate(JS_ES_CONFIDENCIAL):
                        intentadas += 1
                        print(f"[{i + 1}/{total_expedientes}] Confidencial, se omite.")
                        metrica("ficha", time.time(), "confidencial", intentadas, pagina_actual, 0)
                        continue

                    n_reporte = 0
                    total_reportes = 1
                    while n_reporte < total_reportes and not limite_alcanzado():
                        t_ficha = time.time()
                        intentadas += 1
                        etiqueta = f"[{i + 1}/{total_expedientes}]" + (f" reporte {n_reporte + 1}/{total_reportes}" if total_reportes > 1 else "")

                        modal, radios, estado = abrir_reporte(page, flecha, n_reporte)
                        if estado != "ok":
                            print(f"{etiqueta} No disponible ({estado}), se omite.")
                            cerrar_modal(page)
                            metrica("ficha", t_ficha, estado, intentadas, pagina_actual, time.time() - t_ficha)
                            contar_falla(estado == "sin_datos")
                            break
                        total_reportes = max(1, radios.count())

                        try:
                            guid = RE_GUID.search(modal.inner_text(timeout=5000))
                        except Exception:
                            guid = None
                        clave = f"{guid.group(0).upper() if guid else 'SIN_GUID'}#{n_reporte + 1}"
                        if guid and omitir_repetidas and clave not in ya_descargadas:
                            ya_descargadas |= leer_registro(ruta_registro)
                        if guid and clave in ya_descargadas:
                            print(f"{etiqueta} Ya descargada antes ({clave}), se omite.")
                            cerrar_modal(page)
                            metrica("ficha", t_ficha, "repetida", intentadas, pagina_actual, time.time() - t_ficha)
                            n_reporte += 1
                            continue

                        resultado, tamano = "error_descarga", ""
                        try:
                            nombre_archivo = f"{nombre_carpeta}_{siguiente_num:03d}.pdf"
                            ruta_archivo = os.path.join(carpeta_destino, nombre_archivo)
                            for intento_pdf in range(2):
                                if intento_pdf:
                                    time.sleep(2)
                                with page.expect_download(timeout=TIMEOUT_DESCARGA_MS) as download_info:
                                    modal.locator("h5:has-text('Descargar PDF')").click()
                                download_info.value.save_as(ruta_archivo)
                                tamano = os.path.getsize(ruta_archivo)
                                if tamano != TAMANO_FICHA_VACIA:
                                    break
                            if tamano == TAMANO_FICHA_VACIA:
                                os.remove(ruta_archivo)
                                resultado = "vacia"
                                print(f"{etiqueta} Salió vacía (datos no cargados), descartada.")
                            else:
                                descargados += 1
                                siguiente_num += 1
                                resultado = "ok"
                                if guid:
                                    anotar_registro(ruta_registro, clave, os.path.join(nombre_carpeta, nombre_archivo), tamano)
                                    ya_descargadas.add(clave)
                                print(f"{etiqueta} Guardado: {nombre_archivo} ({time.time() - t_ficha:.1f} s)")
                        except Exception as e:
                            print(f"{etiqueta} Error durante la descarga del PDF: {e}")
                        t_proceso = time.time() - t_ficha
                        cerrar_modal(page)
                        time.sleep(PAUSA_ENTRE_FICHAS_S)
                        metrica("ficha", t_ficha, resultado, intentadas, pagina_actual, t_proceso, tamano)
                        contar_falla(resultado != "ok")
                        n_reporte += 1

                if limite_alcanzado():
                    break

                print("Navegando a la siguiente página...")
                estado_pagina = siguiente_pagina(page)
                if estado_pagina == "fin":
                    print("Fin de la paginación.")
                    break
                if estado_pagina == "no_cargo":
                    print(f"La página {pagina_actual + 1} no cargó en {TIMEOUT_PAGINA_S} s; se termina aquí. "
                          "Vuelve a correr el apellido para continuar.")
                    metrica("error", t_corrida, "pagina_no_cargo", pagina=pagina_actual + 1)
                    break
                pagina_actual += 1

        except Exception as e:
            print(f"Error en la ejecución: {e}")
            metrica("error", t_corrida, f"excepcion: {type(e).__name__}")
        except KeyboardInterrupt:
            print("\nInterrumpido por el usuario (Ctrl+C).")
            metrica("error", t_corrida, "interrumpido")
        finally:
            metrica("fin", t_corrida, "fin")
            print(f"Proceso finalizado. Total descargado: {descargados} en {time.time() - t_corrida:.0f} s")
            print(f"Métricas guardadas en: {archivo_metricas} (corrida {corrida})")
            try:
                browser.close()
            except Exception:
                pass
        return descargados


if __name__ == '__main__':
    if "--oculto" in sys.argv:
        HEADLESS = True
    args = [a for a in sys.argv[1:] if a != "--oculto"]
    iniciar_ingesta_dinamica(args[0] if args else None,
                             int(args[1]) if len(args) > 1 else LIMITE_DESCARGAS)
