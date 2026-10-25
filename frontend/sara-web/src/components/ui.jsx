import { Loader2 } from 'lucide-react'

export function Cabecera({ titulo, descripcion, derecha }) {
  return (
    <header className={`cabecera ${derecha ? 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between' : ''}`}>
      <div>
        <h2 className="text-2xl font-black uppercase sm:text-3xl">{titulo}</h2>
        {descripcion && <p className="mt-1 text-base font-medium text-gray-700">{descripcion}</p>}
      </div>
      {derecha}
    </header>
  )
}

const TONOS = {
  blanco: 'bg-white text-black',
  gris: 'bg-gray-200 text-black',
  negro: 'bg-black text-white',
  punteado: 'bg-gray-100 text-black border-dashed',
}

export function Chip({ tono = 'blanco', icono: Icono, children, className = '' }) {
  return (
    <span className={`chip ${TONOS[tono]} ${className}`}>
      {Icono && <Icono className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
      {children}
    </span>
  )
}

export function Cargando({ className = 'h-4 w-4' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />
}

export function Vacio({ icono: Icono, titulo, children, accion }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icono && <Icono className="mb-4 h-14 w-14 text-gray-800" aria-hidden />}
      <h3 className="text-xl font-black uppercase">{titulo}</h3>
      {children && <p className="mt-2 max-w-md font-medium text-gray-600">{children}</p>}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  )
}

export function Medidor({ valor, className = '' }) {
  const pct = Math.round(valor * 100)
  return (
    <div className={`h-4 w-full border-2 border-black bg-white ${className}`} role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-black transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Interruptor({ activo, onChange, etiqueta }) {
  return (
    <button type="button" role="switch" aria-checked={activo} onClick={() => onChange(!activo)} className="flex w-full items-center justify-between gap-3 text-left">
      <span className="text-xs font-black uppercase">{etiqueta}</span>
      <span className={`relative block h-6 w-11 shrink-0 border-2 border-black transition-colors ${activo ? 'bg-black' : 'bg-white'}`}>
        <span className={`absolute top-0.5 block h-4 w-4 border-2 border-black transition-transform ${activo ? 'translate-x-[22px] bg-white' : 'translate-x-0.5 bg-gray-200'}`} />
      </span>
    </button>
  )
}
