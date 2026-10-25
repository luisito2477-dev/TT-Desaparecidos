import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { MapPin, FileStack, Cpu, MapPinned, ClipboardCheck, Trophy } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ESTADOS, claveEstado, contarPorEstado } from '../lib/estados'
import { completitud } from '../lib/formato'
import { Cabecera } from '../components/ui'

const TONOS = [
  { fondo: '#e5e7eb', texto: '#000' },
  { fondo: '#9ca3af', texto: '#000' },
  { fondo: '#4b5563', texto: '#fff' },
  { fondo: '#000000', texto: '#fff' },
]

function tono(n, maximo) {
  if (!n || !maximo) return null
  return TONOS[Math.min(TONOS.length - 1, Math.floor((n / maximo) * TONOS.length - 1e-9))]
}

function Cifra({ valor, sufijo = '' }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const pintar = (n) => (el.textContent = `${Math.round(n).toLocaleString('es-MX')}${sufijo}`)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return pintar(valor)
    const estado = { n: 0 }
    const tween = gsap.to(estado, { n: valor, duration: 0.9, ease: 'power2.out', onUpdate: () => pintar(estado.n) })
    return () => tween.kill()
  }, [valor, sufijo])
  return <span ref={ref}>0</span>
}

function Indicador({ icono: Icono, etiqueta, valor, sufijo, nota }) {
  return (
    <div className="border-4 border-black bg-white p-5 brutal-shadow">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase">{etiqueta}</p>
        <Icono className="h-5 w-5 shrink-0" aria-hidden />
      </div>
      <p className="mt-2 text-4xl font-black tabular-nums">
        <Cifra valor={valor} sufijo={sufijo} />
      </p>
      {nota && <p className="mt-1 font-mono text-[11px] font-bold uppercase text-gray-500">{nota}</p>}
    </div>
  )
}

function Barras({ datos, total }) {
  const maximo = Math.max(1, ...datos.map((d) => d.valor))
  return (
    <ul className="space-y-3">
      {datos.map((d) => (
        <li key={d.etiqueta} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3">
          <span className="truncate font-mono text-xs font-bold uppercase">{d.etiqueta}</span>
          <span className="h-5 border-2 border-black bg-white">
            <span className="block h-full bg-black" style={{ width: `${(d.valor / maximo) * 100}%` }} />
          </span>
          <span className="text-right font-mono text-sm font-bold tabular-nums">{total ? `${Math.round((d.valor / total) * 100)}%` : '—'}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Mapa() {
  const { expedientes, demo } = useApp()
  const [activo, setActivo] = useState(null)

  const datos = useMemo(() => {
    const { conteo, sinEstado } = contarPorEstado(expedientes)
    const maximo = Math.max(0, ...Object.values(conteo))
    const ranking = ESTADOS.map((e) => ({ ...e, n: conteo[e.clave] }))
      .filter((e) => e.n > 0)
      .sort((a, b) => b.n - a.n)
    const sexos = [
      { etiqueta: 'Hombres', valor: expedientes.filter((e) => e.sexo === 'HOMBRE').length },
      { etiqueta: 'Mujeres', valor: expedientes.filter((e) => e.sexo === 'MUJER').length },
    ]
    const otros = expedientes.length - sexos[0].valor - sexos[1].valor
    if (otros > 0) sexos.push({ etiqueta: 'Sin dato', valor: otros })
    const porAnio = {}
    for (const e of expedientes) {
      const a = e.fechaHechos?.slice(0, 4)
      if (a) porAnio[a] = (porAnio[a] ?? 0) + 1
    }
    const anios = Object.keys(porAnio).sort().slice(-8).map((a) => ({ etiqueta: a, valor: porAnio[a] }))
    const total = expedientes.length
    return {
      conteo,
      sinEstado,
      maximo,
      ranking,
      sexos,
      anios,
      total,
      conVector: expedientes.filter((e) => e.embeddingData).length,
      entidades: ranking.length,
      completitud: total ? Math.round((expedientes.reduce((s, e) => s + completitud(e), 0) / total) * 100) : 0,
    }
  }, [expedientes])

  const detalle = activo ? ESTADOS.find((e) => e.clave === activo) : null
  const delEstado = activo ? expedientes.filter((e) => claveEstado(e.estadoHechos) === activo) : []

  return (
    <>
      <Cabecera
        titulo="Mapa Cartográfico"
        descripcion="Distribución de incidencias por entidad federativa."
        derecha={<span className="self-start border-2 border-black bg-gray-200 px-3 py-1 font-mono text-xs font-bold uppercase sm:self-center">{demo ? 'Datos ficticios' : 'Fichas registradas'}</span>}
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador icono={FileStack} etiqueta="Fichas registradas" valor={datos.total} nota={demo ? 'Conjunto de demostración' : 'Ingresadas en este equipo'} />
        <Indicador icono={Cpu} etiqueta="Con vector semántico" valor={datos.conVector} nota="Listas para búsqueda" />
        <Indicador icono={MapPinned} etiqueta="Entidades" valor={datos.entidades} sufijo=" / 32" nota="Con al menos una ficha" />
        <Indicador icono={ClipboardCheck} etiqueta="Completitud" valor={datos.completitud} sufijo="%" nota="Campos extraídos por ficha" />
      </div>

      {datos.total === 0 ? (
        <div className="map-pattern relative mb-8 flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border-4 border-black bg-mapa brutal-shadow">
          <div className="z-10 border-4 border-black bg-white p-8 text-center brutal-shadow">
            <MapPin className="mx-auto mb-4 h-16 w-16 text-gray-800" aria-hidden />
            <h3 className="text-xl font-black uppercase">Motor de Mapeo</h3>
            <p className="mt-2 font-medium text-gray-600">Aún no hay fichas registradas para mapear.</p>
            <Link to="/" className="btn-gris mt-6">
              Ir a Extracción
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-6 xl:grid-cols-3">
            <div className="map-pattern relative overflow-hidden rounded-lg border-4 border-black bg-mapa p-4 brutal-shadow sm:p-6 xl:col-span-2">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="border-2 border-black bg-white px-3 py-1 text-sm font-black uppercase">Fichas por entidad</span>
                <span className="flex items-center gap-1.5 border-2 border-black bg-white px-2 py-1 font-mono text-[11px] font-bold">
                  MENOS
                  {TONOS.map((t) => (
                    <span key={t.fondo} className="h-3 w-5 border border-black" style={{ backgroundColor: t.fondo }} />
                  ))}
                  MÁS
                </span>
              </div>

              <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }} role="list" aria-label="Fichas por entidad">
                {ESTADOS.map((e) => {
                  const n = datos.conteo[e.clave]
                  const t = tono(n, datos.maximo)
                  return (
                    <button
                      key={e.clave}
                      type="button"
                      role="listitem"
                      onMouseEnter={() => setActivo(e.clave)}
                      onFocus={() => setActivo(e.clave)}
                      onClick={() => setActivo(e.clave)}
                      aria-label={`${e.nombre}: ${n} fichas`}
                      style={{ gridColumnStart: e.col + 1, gridRowStart: e.fila + 1, backgroundColor: t?.fondo ?? '#fff', color: t?.texto ?? '#9ca3af' }}
                      className={`flex aspect-square flex-col items-center justify-center border-2 border-black text-center transition-transform ${
                        activo === e.clave ? '-translate-x-0.5 -translate-y-0.5 brutal-shadow-sm' : 'hover:-translate-y-0.5'
                      }`}
                    >
                      <span className="text-[9px] font-black sm:text-xs">{e.clave}</span>
                      <span className="hidden font-mono text-[11px] font-bold sm:block">{n}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 min-h-[4rem] border-4 border-black bg-white p-4">
                {detalle ? (
                  <>
                    <p className="text-lg font-black uppercase">{detalle.nombre}</p>
                    <p className="font-mono text-xs font-bold">
                      {datos.conteo[detalle.clave]} FICHAS · {datos.total ? Math.round((datos.conteo[detalle.clave] / datos.total) * 100) : 0}% DEL TOTAL ·{' '}
                      {delEstado.filter((e) => e.sexo === 'MUJER').length} MUJERES · {delEstado.filter((e) => e.sexo === 'HOMBRE').length} HOMBRES
                    </p>
                  </>
                ) : (
                  <p className="font-mono text-sm font-bold text-gray-500">PASA EL CURSOR O SELECCIONA UNA ENTIDAD PARA VER SU DETALLE</p>
                )}
              </div>
              {datos.sinEstado > 0 && <p className="mt-3 inline-block bg-white px-1 font-mono text-xs font-bold">{datos.sinEstado} FICHAS SIN ENTIDAD IDENTIFICADA NO APARECEN EN EL MAPA</p>}
            </div>

            <div className="panel">
              <div className="flex h-14 shrink-0 items-center gap-2 border-b-4 border-black bg-gray-200 px-5 font-black uppercase">
                <Trophy className="h-5 w-5" aria-hidden /> Entidades con más fichas
              </div>
              <ol className="max-h-[32rem] overflow-y-auto">
                {datos.ranking.map((e, i) => (
                  <li key={e.clave} className="border-b-2 border-black last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setActivo(e.clave)}
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors ${activo === e.clave ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                    >
                      <span className="w-6 font-mono text-xs font-bold">{String(i + 1).padStart(2, '0')}</span>
                      <span className="flex-1 truncate font-bold">{e.nombre}</span>
                      <span className="font-mono font-bold tabular-nums">{e.n}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mb-8 grid items-start gap-6 md:grid-cols-2">
            <div className="panel p-6">
              <p className="separador-seccion mb-5">Por sexo</p>
              <Barras datos={datos.sexos} total={datos.total} />
            </div>
            <div className="panel p-6">
              <p className="separador-seccion mb-5">Por año de los hechos</p>
              <Barras datos={datos.anios} total={datos.total} />
            </div>
          </div>
        </>
      )}
    </>
  )
}
