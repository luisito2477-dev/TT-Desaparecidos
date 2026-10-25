const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const RUTAS = {
  subirFicha: '/api/ms-core/archivos/upload',
  busquedaVectorial: '/api/busqueda/vectorial',
}

export class ApiError extends Error {
  constructor(mensaje, status = 0, tipo = 'servidor') {
    super(mensaje)
    this.status = status
    this.tipo = tipo
  }
}

async function leerCuerpo(respuesta) {
  const texto = await respuesta.text()
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return { message: texto.slice(0, 300) }
  }
}

export async function verificarConexion() {
  try {
    const r = await fetch(BASE + RUTAS.subirFicha, { method: 'GET', cache: 'no-store' })
    return [200, 400, 401, 403, 405, 415].includes(r.status)
  } catch {
    return false
  }
}

export async function subirFicha(archivo, signal) {
  const datos = new FormData()
  datos.append('file', archivo)

  let respuesta
  try {
    respuesta = await fetch(BASE + RUTAS.subirFicha, { method: 'POST', body: datos, signal })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('No se pudo conectar con MS-Core. Verifica que el servicio esté en ejecución.', 0, 'conexion')
  }

  const cuerpo = await leerCuerpo(respuesta)
  if (respuesta.ok) return cuerpo

  const mensaje = cuerpo?.message ?? ''
  if (respuesta.status === 409 || /procesado anteriormente|duplicad/i.test(mensaje)) {
    throw new ApiError('Esta ficha ya estaba registrada en el sistema.', respuesta.status, 'duplicada')
  }
  if (respuesta.status === 400 || respuesta.status === 422) {
    throw new ApiError(mensaje || 'El documento no es una ficha válida.', respuesta.status, 'invalida')
  }
  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new ApiError(
      `MS-Core rechazó la petición (${respuesta.status}). Suele indicar un error interno no controlado en el servidor.`,
      respuesta.status,
    )
  }
  if (respuesta.status >= 500) {
    throw new ApiError(mensaje || 'Error interno en MS-Core o MS-IA.', respuesta.status)
  }
  throw new ApiError(mensaje || `MS-Core respondió ${respuesta.status}.`, respuesta.status)
}

export async function buscarExpedientes(consulta, signal) {
  let respuesta
  try {
    respuesta = await fetch(BASE + RUTAS.busquedaVectorial, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consulta),
      signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('No se pudo conectar con MS-Core.', 0, 'conexion')
  }

  if ([401, 403, 404, 405, 501].includes(respuesta.status)) {
    throw new ApiError('La búsqueda semántica todavía no está disponible en MS-Core.', respuesta.status, 'no_disponible')
  }
  const cuerpo = await leerCuerpo(respuesta)
  if (!respuesta.ok) throw new ApiError(cuerpo?.message || `MS-Core respondió ${respuesta.status}.`, respuesta.status)
  return cuerpo
}
