# S.A.R.A. — Frontend

Interfaz web del sistema, con el diseño neobrutalista monocromático del prototipo original. React 18 + Vite + Tailwind CSS + GSAP.

## Requisitos

- Node.js 18 o superior

## Uso

```bash
npm install
npm run dev
```

Se abre en http://localhost:3000 (MS-Core solo acepta peticiones CORS desde los puertos 3000 y 5500).

En desarrollo, las peticiones a `/api` se redirigen a MS-Core (`http://localhost:8080` por defecto). Para cambiarlo, copiar `.env.example` a `.env` y ajustar `VITE_MS_CORE_URL`.

Compilación para producción:

```bash
npm run build
```

Si el frontend se sirve en un dominio distinto al de MS-Core, definir `VITE_API_URL` con la URL base de MS-Core antes de compilar.

## Módulos

| Ruta | Pestaña | Endpoint |
|---|---|---|
| `/` | Extracción (módulo OCR, carga de fichas en PDF) | `POST /api/ms-core/archivos/upload` |
| `/formulario` | Formulario (registro estructurado y corrección de campos) | pendiente en MS-Core |
| `/busqueda` | Búsqueda semántica con filtros | `POST /api/busqueda/vectorial` (pendiente en MS-Core) |
| `/mapa` | Mapa territorial e indicadores | — |

## Modo demostración

El interruptor de la barra lateral activa un conjunto de 240 expedientes ficticios para mostrar la interfaz sin backend. En modo normal, la ingesta llama a MS-Core y los expedientes registrados se guardan en el navegador para el formulario y el mapa.

## Estructura

```
src/
  components/   Layout, panel de expediente y componentes base
  context/      Estado global (modo demo, conexión, expedientes, borrador del formulario)
  lib/          Cliente de la API, formatos, estados de la República, datos demo
  pages/        Extracción, Formulario, Búsqueda, Mapa
```
