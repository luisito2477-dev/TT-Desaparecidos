import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Copy, Check, LayoutTemplate, MapPin, Fingerprint, Cpu, ClipboardList } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { CAMPOS, completitud, iniciales, valorCampo } from '../lib/formato'
import { Chip, Medidor } from './ui'

const GRUPOS = [
  { clave: 'generales', titulo: 'Datos Generales', icono: LayoutTemplate },
  { clave: 'hechos', titulo: 'Datos de los Hechos', icono: MapPin },
  { clave: 'descripcion', titulo: 'Tatuajes, Señas y Descripción', icono: Fingerprint },
]

function Folio({ folio }) {
  const [copiado, setCopiado] = useState(false)
  if (!folio) return null
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(folio)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {}
  }
  return (
    <button type="button" onClick={copiar} className="inline-flex items-center gap-1.5 font-mono text-xs font-bold hover:underline" title="Copiar folio">
      {folio}
      {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export default function ExpedienteDetalle() {
  const { seleccionado: exp, cerrarExpediente, setBorrador } = useApp()
  const navegar = useNavigate()
  const panel = useRef(null)

  useEffect(() => {
    if (!exp) return
    const alTeclear = (e) => e.key === 'Escape' && cerrarExpediente()
    document.addEventListener('keydown', alTeclear)
    panel.current?.focus()
    return () => document.removeEventListener('keydown', alTeclear)
  }, [exp, cerrarExpediente])

  if (!exp) return null
  const pct = completitud(exp)

  const editar = () => {
    setBorrador(exp)
    cerrarExpediente()
    navegar('/formulario')
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="detalle-titulo">
      <div className="absolute inset-0 bg-black/40" onClick={cerrarExpediente} />
      <div ref={panel} tabIndex={-1} className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l-4 border-black bg-white outline-none">
        <div className="flex items-start gap-4 border-b-4 border-black bg-gray-200 px-6 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black bg-white text-lg font-black brutal-shadow-sm">{iniciales(exp.nombre)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Expediente</p>
            <h2 id="detalle-titulo" className="truncate text-xl font-black uppercase">
              {exp.nombre ?? 'Nombre no extraído'}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Folio folio={exp.folio} />
              {exp.demo && <Chip tono="punteado">Ficticio</Chip>}
            </div>
          </div>
          <button type="button" onClick={cerrarExpediente} className="border-2 border-black bg-white p-1.5 brutal-btn" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="border-2 border-black p-4 brutal-shadow-sm">
              <p className="text-xs font-black uppercase">Campos extraídos</p>
              <p className="mt-1 text-2xl font-black tabular-nums">{Math.round(pct * 100)}%</p>
              <Medidor valor={pct} className="mt-2" />
            </div>
            <div className="border-2 border-black p-4 brutal-shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-black uppercase">
                <Cpu className="h-3.5 w-3.5" /> Vector
              </p>
              {exp.embeddingData ? (
                <>
                  <p className="mt-1 text-2xl font-black tabular-nums">{exp.embeddingData.dimension} dim</p>
                  <p className="mt-1 truncate font-mono text-[11px] font-bold text-gray-600">{exp.embeddingData.transformerModel}</p>
                </>
              ) : (
                <p className="mt-1 font-mono text-sm font-bold text-gray-600">Sin campos descriptivos</p>
              )}
            </div>
          </div>

          {GRUPOS.map(({ clave, titulo, icono: Icono }) => (
            <section key={clave} className="mb-8">
              <p className="separador-seccion mb-4">
                <Icono className="h-5 w-5" aria-hidden /> {titulo}
              </p>
              <dl className={`grid gap-x-6 gap-y-4 ${clave === 'descripcion' ? '' : 'sm:grid-cols-2'}`}>
                {CAMPOS.filter((c) => c.grupo === clave).map((c) => {
                  const v = valorCampo(c, exp)
                  return (
                    <div key={c.clave} className={c.largo ? 'border-2 border-black bg-gray-50 p-3' : ''}>
                      <dt className="text-xs font-bold uppercase text-gray-500">{c.etiqueta}</dt>
                      <dd className={`mt-0.5 font-mono text-sm font-bold ${v === null ? 'text-gray-400' : ''}`}>{v ?? 'NO EXTRAÍDO'}</dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          ))}
        </div>

        <div className="flex justify-end border-t-4 border-black bg-gray-200 p-5">
          <button type="button" onClick={editar} className="btn-negro w-full sm:w-auto">
            <ClipboardList className="h-5 w-5" /> Abrir en formulario
          </button>
        </div>
      </div>
    </div>
  )
}
