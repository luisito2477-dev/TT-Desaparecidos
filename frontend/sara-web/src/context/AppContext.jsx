import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { verificarConexion } from '../lib/api'
import { EXPEDIENTES_DEMO } from '../lib/demo'

const AppContext = createContext(null)

function leer(clave, porDefecto) {
  try {
    const v = localStorage.getItem(clave)
    return v === null ? porDefecto : JSON.parse(v)
  } catch {
    return porDefecto
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {}
}

function nuevoId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `exp-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

function aligerar(exp) {
  const { embeddingData, ...resto } = exp
  return {
    ...resto,
    id: exp.id ?? nuevoId(),
    embeddingData: embeddingData ? { dimension: embeddingData.dimension, transformerModel: embeddingData.transformerModel } : null,
  }
}

export function AppProvider({ children }) {
  const [demo, setDemo] = useState(() => leer('sara.demo', true))
  const [conexion, setConexion] = useState('verificando')
  const [registrados, setRegistrados] = useState(() => leer('sara.expedientes', []))
  const [seleccionado, setSeleccionado] = useState(null)
  const [borrador, setBorrador] = useState(null)

  useEffect(() => guardar('sara.demo', demo), [demo])
  useEffect(() => guardar('sara.expedientes', registrados), [registrados])

  const revisarConexion = useCallback(async () => {
    setConexion('verificando')
    setConexion((await verificarConexion()) ? 'en_linea' : 'sin_conexion')
  }, [])

  useEffect(() => {
    revisarConexion()
    const id = setInterval(revisarConexion, 60000)
    return () => clearInterval(id)
  }, [revisarConexion])

  const agregarExpediente = useCallback((exp) => {
    const ligero = { ...aligerar(exp), registradoEn: new Date().toISOString() }
    setRegistrados((lista) => [ligero, ...lista].slice(0, 5000))
    return ligero
  }, [])

  const guardarExpediente = useCallback((exp) => {
    const ligero = { ...aligerar(exp), editadoEn: new Date().toISOString() }
    setRegistrados((lista) => {
      const i = lista.findIndex((e) => e.id === ligero.id)
      if (i < 0) return [{ ...ligero, registradoEn: ligero.editadoEn }, ...lista]
      const copia = [...lista]
      copia[i] = { ...copia[i], ...ligero }
      return copia
    })
    return ligero
  }, [])

  const expedientes = useMemo(() => (demo ? EXPEDIENTES_DEMO : registrados), [demo, registrados])

  const valor = {
    demo,
    setDemo,
    conexion,
    revisarConexion,
    registrados,
    agregarExpediente,
    guardarExpediente,
    expedientes,
    seleccionado,
    abrirExpediente: setSeleccionado,
    cerrarExpediente: () => setSeleccionado(null),
    borrador,
    setBorrador,
  }

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
