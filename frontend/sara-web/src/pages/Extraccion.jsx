import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import {
  UploadCloud,
  FileText,
  FileOutput,
  Send,
  Square,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  AlertTriangle,
  ListOrdered,
  ClipboardList,
  Eye,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { subirFicha } from '../lib/api'
import { validarPdf } from '../lib/pdf'
import { extraccionDemo } from '../lib/demo'
import { CAMPOS, completitud, tamano, valorCampo } from '../lib/formato'
import { Cabecera, Chip, Cargando, Medidor } from '../components/ui'

const ESTADOS = {
  pendiente: { etiqueta: 'En cola', tono: 'blanco', icono: Clock },
  procesando: { etiqueta: 'Procesando', tono: 'gris', icono: null },
  registrado: { etiqueta: 'Registrada', tono: 'negro', icono: CheckCircle2 },
  duplicada: { etiqueta: 'Duplicada', tono: 'punteado', icono: Copy },
  invalido: { etiqueta: 'Inválido', tono: 'blanco', icono: XCircle },
  error: { etiqueta: 'Error', tono: 'blanco', icono: AlertTriangle },
}

let contador = 0

function EstadoArchivo({ estado }) {
  const e = ESTADOS[estado]
  return (
    <Chip tono={e.tono} icono={e.icono ?? undefined}>
      {estado === 'procesando' && <Cargando className="h-3 w-3" />}
      {e.etiqueta}
    </Chip>
  )
}

function DatosExtraidos({ item }) {
  const { abrirExpediente, setBorrador } = useApp()
  const navegar = useNavigate()

  if (!item || item.estado === 'pendiente') {
    return (
      <div className="min-h-[200px] w-full border-4 border-black bg-white p-4 font-mono font-bold text-gray-400 brutal-shadow-sm">
        {item ? `${item.archivo.name} está en cola. Presiona ENVIAR para procesarla...` : 'Aquí aparecerán los datos de la ficha tras ejecutar la extracción...'}
      </div>
    )
  }

  if (item.estado === 'procesando') {
    return (
      <div className="flex min-h-[200px] w-full flex-col items-center justify-center gap-3 border-4 border-black bg-gray-50 p-4 font-mono font-bold brutal-shadow-sm">
        <Cargando className="h-8 w-8" />
        <p>EJECUTANDO OCR SOBRE {item.archivo.name.toUpperCase()}...</p>
        <p className="text-xs text-gray-500">MS-IA convierte la ficha en texto, estructura los campos y genera el vector</p>
      </div>
    )
  }

  if (item.estado !== 'registrado') {
    return (
      <div className="min-h-[120px] w-full border-4 border-black bg-white p-4 brutal-shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold">{item.archivo.name}</span>
          <EstadoArchivo estado={item.estado} />
        </div>
        <p className="flex items-start gap-2 font-bold">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          {item.mensaje}
        </p>
      </div>
    )
  }

  const exp = item.resultado
  const pct = completitud(exp)
  const llenos = CAMPOS.filter((c) => valorCampo(c, exp) !== null).length

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-2 border-black bg-white p-4 brutal-shadow-sm">
          <p className="text-xs font-black uppercase">Campos extraídos</p>
          <p className="mt-1 text-2xl font-black tabular-nums">
            {llenos} <span className="text-base text-gray-500">/ {CAMPOS.length}</span>
          </p>
          <Medidor valor={pct} className="mt-2" />
        </div>
        <div className="border-2 border-black bg-white p-4 brutal-shadow-sm">
          <p className="text-xs font-black uppercase">Vector semántico</p>
          <p className="mt-1 font-mono text-sm font-bold">
            {exp.embeddingData ? `${exp.embeddingData.dimension} dimensiones generadas` : 'No generado: sin campos descriptivos'}
          </p>
          <p className="mt-2 font-mono text-xs text-gray-500">{item.duracion ? `Procesada en ${(item.duracion / 1000).toFixed(1)} s` : ''}</p>
        </div>
      </div>

      <dl className="w-full divide-y-2 divide-black border-4 border-black bg-white brutal-shadow-sm">
        {CAMPOS.map((c) => {
          const v = valorCampo(c, exp)
          return (
            <div key={c.clave} className="grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-black uppercase sm:pt-0.5">{c.etiqueta}</dt>
              <dd className={`font-mono text-sm font-bold sm:col-span-2 ${v === null ? 'text-gray-400' : ''}`}>{v ?? 'NO EXTRAÍDO'}</dd>
            </div>
          )
        })}
      </dl>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-gris" onClick={() => abrirExpediente(exp)}>
          <Eye className="h-4 w-4" /> Ver expediente
        </button>
        <button
          type="button"
          className="btn-gris"
          onClick={() => {
            setBorrador({ ...exp, origen: item.archivo.name })
            navegar('/formulario')
          }}
        >
          <ClipboardList className="h-4 w-4" /> Corregir en formulario
        </button>
      </div>
    </div>
  )
}

export default function Extraccion() {
  const { demo, agregarExpediente } = useApp()
  const [cola, setCola] = useState([])
  const [seleccion, setSeleccion] = useState(null)
  const [activo, setActivo] = useState(false)
  const [encima, setEncima] = useState(false)
  const entrada = useRef(null)
  const icono = useRef(null)
  const detener = useRef(false)
  const controlador = useRef(null)
  const colaRef = useRef(cola)
  colaRef.current = cola

  const actualizar = useCallback((id, cambios) => {
    setCola((c) => c.map((i) => (i.id === id ? { ...i, ...cambios } : i)))
  }, [])

  const agregar = useCallback(async (archivos) => {
    const nuevos = await Promise.all(
      Array.from(archivos).map(async (archivo) => {
        const error = await validarPdf(archivo)
        return { id: ++contador, archivo, estado: error ? 'invalido' : 'pendiente', mensaje: error, resultado: null }
      }),
    )
    if (!nuevos.length) return
    if (icono.current && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.to(icono.current, { y: -15, yoyo: true, repeat: 3, duration: 0.2 })
    }
    setCola((c) => [...c, ...nuevos])
    setSeleccion((s) => s ?? nuevos[0].id)
  }, [])

  const procesar = useCallback(async () => {
    setActivo(true)
    detener.current = false
    while (!detener.current) {
      const item = colaRef.current.find((i) => i.estado === 'pendiente')
      if (!item) break
      actualizar(item.id, { estado: 'procesando', mensaje: null })
      setSeleccion(item.id)
      const inicio = performance.now()
      controlador.current = new AbortController()
      try {
        const respuesta = demo
          ? await new Promise((ok) => setTimeout(() => ok(extraccionDemo(item.archivo.name)), 900 + Math.random() * 1100))
          : await subirFicha(item.archivo, controlador.current.signal)
        const resultado = agregarExpediente(respuesta)
        actualizar(item.id, { estado: 'registrado', resultado, duracion: performance.now() - inicio })
      } catch (e) {
        if (e.name === 'AbortError') {
          actualizar(item.id, { estado: 'pendiente' })
          break
        }
        actualizar(item.id, {
          estado: e.tipo === 'duplicada' ? 'duplicada' : e.tipo === 'invalida' ? 'invalido' : 'error',
          mensaje: e.message,
        })
      }
    }
    controlador.current = null
    setActivo(false)
  }, [demo, actualizar, agregarExpediente])

  const parar = () => {
    detener.current = true
    controlador.current?.abort()
  }

  useEffect(() => () => controlador.current?.abort(), [])

  const resumen = cola.reduce((r, i) => ({ ...r, [i.estado]: (r[i.estado] ?? 0) + 1 }), {})
  const pendientes = resumen.pendiente ?? 0
  const terminados = cola.filter((i) => !['pendiente', 'procesando'].includes(i.estado)).length
  const fallidos = (resumen.error ?? 0) + (resumen.invalido ?? 0)
  const itemSeleccionado = cola.find((i) => i.id === seleccion)

  return (
    <>
      <Cabecera titulo="Módulo OCR" descripcion="Carga de fichas de búsqueda en PDF para la extracción automática de sus datos." />

      <div className="panel mb-8 shrink-0">
        <div
          onClick={() => entrada.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setEncima(true)
          }}
          onDragLeave={() => setEncima(false)}
          onDrop={(e) => {
            e.preventDefault()
            setEncima(false)
            agregar(e.dataTransfer.files)
          }}
          className={`upload-zone relative flex cursor-pointer flex-col items-center justify-center border-b-4 border-black bg-gray-50 p-8 text-center transition-colors ${encima ? 'dragover' : ''}`}
        >
          <div ref={icono}>
            <UploadCloud className="mb-4 h-16 w-16" aria-hidden />
          </div>
          <h3 className="text-xl font-black uppercase">Subir Fichas de Búsqueda</h3>
          <p className="mb-6 mt-2 text-sm font-medium text-gray-600">Arrastra uno o varios PDF aquí o haz clic para explorar · máximo 10 MB por archivo</p>
          <input
            ref={entrada}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              agregar(e.target.files)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="btn-gris relative z-10 px-8 py-3"
            onClick={(e) => {
              e.stopPropagation()
              entrada.current?.click()
            }}
          >
            <FileText className="h-5 w-5" /> Extraer Texto
          </button>
        </div>

        {cola.length > 0 && (
          <div className="border-b-4 border-black p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="titulo-seccion mb-0">
                <ListOrdered className="h-5 w-5" aria-hidden /> Cola de procesamiento
              </p>
              <p className="font-mono text-xs font-bold">
                {terminados}/{cola.length} TERMINADAS · {resumen.registrado ?? 0} REGISTRADAS
                {resumen.duplicada ? ` · ${resumen.duplicada} DUPLICADAS` : ''}
                {fallidos ? ` · ${fallidos} CON ERROR` : ''}
              </p>
            </div>
            <div className="mb-5 h-4 w-full border-2 border-black bg-white">
              <div className="h-full bg-black transition-[width] duration-500" style={{ width: `${(terminados / cola.length) * 100}%` }} />
            </div>
            <ul className="max-h-72 space-y-3 overflow-y-auto pb-1 pr-2">
              {cola.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => setSeleccion(i.id)}
                    className={`flex w-full items-center gap-3 border-2 border-black px-4 py-3 text-left transition-all ${
                      seleccion === i.id ? 'bg-gray-200 brutal-shadow-sm' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{i.archivo.name}</span>
                      <span className="block font-mono text-xs text-gray-600">{tamano(i.archivo.size)}</span>
                    </span>
                    <EstadoArchivo estado={i.estado} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col p-6 sm:p-8">
          <p className="titulo-seccion">
            <FileOutput className="h-5 w-5" aria-hidden /> Datos Extraídos
          </p>
          <DatosExtraidos item={itemSeleccionado} />
        </div>

        <div className="pie-panel flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs font-bold text-gray-600">
            {demo ? 'MODO DEMOSTRACIÓN · SIN ENVÍO AL SERVIDOR' : 'POST /api/ms-core/archivos/upload · UNA FICHA A LA VEZ'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-blanco"
              onClick={() => {
                setCola((c) => c.filter((i) => i.estado === 'procesando'))
                setSeleccion(null)
              }}
              disabled={!cola.length || activo}
            >
              <Trash2 className="h-4 w-4" /> Vaciar cola
            </button>
            {activo ? (
              <button type="button" className="btn-negro px-12 py-4" onClick={parar}>
                <Square className="h-5 w-5" /> Detener
              </button>
            ) : (
              <button type="button" className="btn-negro px-12 py-4" onClick={procesar} disabled={!pendientes}>
                <Send className="h-5 w-5" /> Enviar{pendientes ? ` (${pendientes})` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
