import { useRef, useState } from 'react'
import { Search, SlidersHorizontal, Eraser, SearchX, Construction, ChevronRight, Fingerprint } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { buscarExpedientes } from '../lib/api'
import { buscarDemo } from '../lib/demo'
import { ESTADOS, claveEstado, nombreEstado } from '../lib/estados'
import { fecha, normalizar } from '../lib/formato'
import { Cabecera, Chip, Cargando, Vacio } from '../components/ui'

const EJEMPLOS = ['Tatuaje de rosa en el antebrazo', 'Mujer con vestido amarillo', 'Cicatriz en la ceja y chamarra negra', 'Joven con sudadera gris']

const FILTROS_VACIOS = { sexo: '', estado: '', edadMin: '', edadMax: '', desde: '', hasta: '' }

function Resaltado({ texto, terminos }) {
  if (!texto) return <span className="text-gray-400">SIN DATO</span>
  if (!terminos?.length) return texto
  return texto.split(/(\s+|,)/).map((p, i) => {
    const n = normalizar(p)
    return n.length > 2 && terminos.some((t) => n.startsWith(t)) ? (
      <mark key={i} className="bg-black px-0.5 text-white">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  })
}

function Resultado({ resultado, alAbrir }) {
  const { expediente: e, similitud, terminos } = resultado
  const pct = Math.round(similitud * 100)
  const clave = claveEstado(e.estadoHechos)
  return (
    <button type="button" onClick={alAbrir} className="group flex w-full flex-col gap-4 border-4 border-black bg-white p-5 text-left brutal-shadow transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-lg font-black uppercase">{e.nombre ?? 'Nombre no extraído'}</p>
          {e.demo && <Chip tono="punteado">Ficticio</Chip>}
        </div>
        <p className="mt-1 font-mono text-xs font-bold text-gray-600">
          {[e.sexo, e.edadDesaparicion != null ? `${e.edadDesaparicion} AÑOS` : null, clave ? nombreEstado(clave).toUpperCase() : e.estadoHechos, fecha(e.fechaHechos)]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <dl className="mt-3 space-y-1.5 font-mono text-sm font-bold">
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-xs font-black uppercase leading-5 text-gray-500">Señas</dt>
            <dd className="min-w-0">
              <Resaltado texto={e.senasParticulares} terminos={terminos} />
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-xs font-black uppercase leading-5 text-gray-500">Vestimenta</dt>
            <dd className="min-w-0">
              <Resaltado texto={e.prendasVestir} terminos={terminos} />
            </dd>
          </div>
        </dl>
      </div>
      <div className="flex shrink-0 items-center gap-4 border-t-2 border-black pt-4 sm:w-40 sm:flex-col sm:items-stretch sm:gap-2 sm:border-l-2 sm:border-t-0 sm:pl-5 sm:pt-0">
        <p className="text-xs font-black uppercase">Similitud</p>
        <p className="text-3xl font-black tabular-nums">{pct}%</p>
        <div className="h-3 w-24 border-2 border-black bg-white sm:w-full">
          <div className="h-full bg-black" style={{ width: `${pct}%` }} />
        </div>
        <ChevronRight className="ml-auto h-5 w-5 transition-transform group-hover:translate-x-1 sm:ml-0 sm:self-end" aria-hidden />
      </div>
    </button>
  )
}

export default function Busqueda() {
  const { demo, abrirExpediente } = useApp()
  const [texto, setTexto] = useState('')
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [estado, setEstado] = useState({ fase: 'inicial', resultados: [], error: null })
  const controlador = useRef(null)

  const cambiar = (campo) => (e) => setFiltros((f) => ({ ...f, [campo]: e.target.value }))

  const buscar = async (consultaTexto = texto) => {
    if (!consultaTexto.trim()) return
    controlador.current?.abort()
    controlador.current = new AbortController()
    setEstado({ fase: 'buscando', resultados: [], error: null })
    const consulta = { textoBusqueda: consultaTexto.trim(), ...filtros }
    try {
      if (demo) {
        await new Promise((ok) => setTimeout(ok, 450))
        setEstado({ fase: 'listo', resultados: buscarDemo(consulta), error: null })
      } else {
        const respuesta = await buscarExpedientes(consulta, controlador.current.signal)
        const lista = Array.isArray(respuesta) ? respuesta : respuesta?.resultados ?? respuesta?.content ?? []
        const resultados = lista.map((r) => ({ expediente: r.expediente ?? r, similitud: r.similitud ?? r.score ?? 0, terminos: [] }))
        setEstado({ fase: 'listo', resultados, error: null })
      }
    } catch (e) {
      if (e.name === 'AbortError') return
      setEstado({ fase: 'error', resultados: [], error: e })
    }
  }

  const activos = Object.values(filtros).filter(Boolean).length

  return (
    <>
      <Cabecera titulo="Búsqueda Semántica" descripcion="Describe rasgos, tatuajes o vestimenta con tus palabras; el sistema compara la descripción con las fichas registradas." />

      <form
        className="panel mb-8 shrink-0"
        onSubmit={(e) => {
          e.preventDefault()
          buscar()
        }}
      >
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div>
            <label htmlFor="consulta" className="titulo-seccion">
              <Fingerprint className="h-5 w-5" aria-hidden /> Descripción de la persona
            </label>
            <textarea
              id="consulta"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  buscar()
                }
              }}
              className="campo-largo min-h-[120px]"
              placeholder="Ej. hombre de complexión delgada con tatuaje de colibrí en el pecho, llevaba playera roja..."
            />
            <div className="mt-4 flex flex-wrap gap-3">
              {EJEMPLOS.map((ej) => (
                <button
                  key={ej}
                  type="button"
                  onClick={() => {
                    setTexto(ej)
                    buscar(ej)
                  }}
                  className="border-2 border-black bg-white px-3 py-1 text-xs font-bold uppercase brutal-btn hover:bg-gray-100"
                >
                  {ej}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-2 border-black" />

          <div>
            <div className="separador-seccion mb-6">
              <SlidersHorizontal className="h-5 w-5" aria-hidden /> Filtros
              {activos > 0 && <span className="bg-black px-1.5 font-mono text-xs text-white">{activos}</span>}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="etiqueta" htmlFor="f-sexo">Sexo</label>
                <select id="f-sexo" className="campo" value={filtros.sexo} onChange={cambiar('sexo')}>
                  <option value="">Todos</option>
                  <option value="HOMBRE">Hombre</option>
                  <option value="MUJER">Mujer</option>
                </select>
              </div>
              <div>
                <label className="etiqueta" htmlFor="f-estado">Entidad / Estado</label>
                <select id="f-estado" className="campo" value={filtros.estado} onChange={cambiar('estado')}>
                  <option value="">Todas</option>
                  {[...ESTADOS].sort((a, b) => a.nombre.localeCompare(b.nombre)).map((e) => (
                    <option key={e.clave} value={e.clave}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="etiqueta">Edad al desaparecer</span>
                <div className="flex gap-3">
                  <input aria-label="Edad mínima" type="number" min="0" max="120" placeholder="Mín" className="campo" value={filtros.edadMin} onChange={cambiar('edadMin')} />
                  <input aria-label="Edad máxima" type="number" min="0" max="120" placeholder="Máx" className="campo" value={filtros.edadMax} onChange={cambiar('edadMax')} />
                </div>
              </div>
              <div>
                <span className="etiqueta">Fecha de los hechos</span>
                <div className="flex flex-col gap-3">
                  <input aria-label="Desde" type="date" className="campo" value={filtros.desde} onChange={cambiar('desde')} />
                  <input aria-label="Hasta" type="date" className="campo" value={filtros.hasta} onChange={cambiar('hasta')} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pie-panel flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn-blanco"
            onClick={() => {
              setTexto('')
              setFiltros(FILTROS_VACIOS)
              setEstado({ fase: 'inicial', resultados: [], error: null })
            }}
          >
            <Eraser className="h-4 w-4" /> Limpiar
          </button>
          <button type="submit" className="btn-negro px-12 py-4" disabled={!texto.trim() || estado.fase === 'buscando'}>
            {estado.fase === 'buscando' ? <Cargando className="h-5 w-5" /> : <Search className="h-5 w-5" />} Buscar
          </button>
        </div>
      </form>

      <section aria-live="polite" className="mb-8">
        {estado.fase === 'buscando' && (
          <div className="space-y-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse border-4 border-black bg-gray-100 brutal-shadow" />
            ))}
          </div>
        )}

        {estado.fase === 'error' && (
          <div className="panel">
            {estado.error.tipo === 'no_disponible' ? (
              <Vacio icono={Construction} titulo="Búsqueda en desarrollo">
                La interfaz ya está lista, pero MS-Core aún no expone el endpoint de búsqueda. Activa el modo demostración para ver cómo funcionará.
              </Vacio>
            ) : (
              <Vacio icono={SearchX} titulo="No se pudo buscar">
                {estado.error.message}
              </Vacio>
            )}
          </div>
        )}

        {estado.fase === 'listo' && (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b-4 border-black pb-2">
              <h3 className="text-xl font-black uppercase">
                {estado.resultados.length} {estado.resultados.length === 1 ? 'resultado' : 'resultados'}
              </h3>
              <p className="font-mono text-xs font-bold">ORDENADOS POR SIMILITUD</p>
            </div>
            {estado.resultados.length === 0 ? (
              <div className="panel">
                <Vacio icono={SearchX} titulo="Sin coincidencias">
                  Prueba con otra descripción o quita algunos filtros.
                </Vacio>
              </div>
            ) : (
              <div className="space-y-5">
                {estado.resultados.map((r) => (
                  <Resultado key={r.expediente.id ?? r.expediente.folio} resultado={r} alAbrir={() => abrirExpediente(r.expediente)} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
