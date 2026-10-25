import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { FileScan, ClipboardList, Search, Map, Menu, X, Crosshair, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Interruptor } from './ui'
import ExpedienteDetalle from './ExpedienteDetalle'

const PESTANAS = [
  { a: '/', etiqueta: 'Extracción', icono: FileScan },
  { a: '/formulario', etiqueta: 'Formulario', icono: ClipboardList },
  { a: '/busqueda', etiqueta: 'Búsqueda', icono: Search },
  { a: '/mapa', etiqueta: 'Mapa Territorial', icono: Map },
]

const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function Logo() {
  return (
    <div className="flex items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white text-xl font-black brutal-shadow-sm">S</div>
      <div className="ml-3">
        <h1 className="text-xl font-black uppercase tracking-tight">S.A.R.A.</h1>
        <span className="bg-black px-1 font-mono text-xs font-bold text-white">v1.0</span>
      </div>
    </div>
  )
}

function Pestanas({ alNavegar }) {
  return (
    <nav className="flex-1 space-y-4 p-5" aria-label="Módulos">
      {PESTANAS.map(({ a, etiqueta, icono: Icono }) => (
        <NavLink
          key={a}
          to={a}
          end={a === '/'}
          onClick={alNavegar}
          className={({ isActive }) =>
            `flex w-full items-center gap-3 border-2 px-4 py-3 font-bold transition-all ${
              isActive ? 'border-black bg-gray-200 brutal-shadow' : 'border-transparent hover:border-black hover:bg-gray-100'
            }`
          }
        >
          <Icono className="h-5 w-5" aria-hidden />
          {etiqueta}
        </NavLink>
      ))}
    </nav>
  )
}

function PanelSistema() {
  const { demo, setDemo, conexion, revisarConexion } = useApp()
  const estado = {
    verificando: ['bg-gray-400 animate-pulse', 'Verificando…'],
    en_linea: ['bg-black', 'En línea'],
    sin_conexion: ['bg-white', 'Sin conexión'],
  }[conexion]
  return (
    <div className="space-y-4 border-t-4 border-black bg-gray-50 p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase">MS-Core</p>
          <p className="mt-1 flex items-center gap-2 font-mono text-xs font-bold">
            <span className={`h-3 w-3 border-2 border-black ${estado[0]}`} />
            {estado[1]}
          </p>
        </div>
        <button type="button" onClick={revisarConexion} className="border-2 border-black bg-white p-1.5 brutal-btn" title="Volver a verificar" aria-label="Volver a verificar la conexión">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <Interruptor activo={demo} onChange={setDemo} etiqueta="Modo demostración" />
    </div>
  )
}

function Lateral({ alNavegar, cerrar }) {
  return (
    <>
      <div className="flex h-20 shrink-0 items-center justify-between border-b-4 border-black bg-gray-200 px-6">
        <Logo />
        {cerrar && (
          <button type="button" onClick={cerrar} className="border-2 border-black bg-white p-1.5 brutal-btn" aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <Pestanas alNavegar={alNavegar} />
      <PanelSistema />
    </>
  )
}

export default function Layout() {
  const { demo } = useApp()
  const [menu, setMenu] = useState(false)
  const ubicacion = useLocation()
  const lateral = useRef(null)
  const vista = useRef(null)
  const desplazable = useRef(null)

  useEffect(() => {
    document.title = `${PESTANAS.find((p) => p.a === ubicacion.pathname)?.etiqueta ?? 'Inicio'} · S.A.R.A.`
    desplazable.current?.scrollTo(0, 0)
  }, [ubicacion.pathname])

  useLayoutEffect(() => {
    if (sinMovimiento()) return
    const tween = gsap.fromTo(lateral.current, { x: -100 }, { x: 0, duration: 0.6, ease: 'power4.out', clearProps: 'transform' })
    return () => {
      tween.kill()
      gsap.set(lateral.current, { clearProps: 'transform' })
    }
  }, [])

  useLayoutEffect(() => {
    if (sinMovimiento()) return
    const tween = gsap.fromTo(vista.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power4.out', clearProps: 'transform,opacity' })
    return () => {
      tween.kill()
      gsap.set(vista.current, { clearProps: 'transform,opacity' })
    }
  }, [ubicacion.pathname])

  return (
    <div className="brutal-pattern flex h-screen overflow-hidden bg-papel text-black">
      <aside ref={lateral} className="relative z-20 hidden w-64 shrink-0 flex-col overflow-y-auto border-r-4 border-black bg-white lg:flex">
        <Lateral />
      </aside>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r-4 border-black bg-white">
            <Lateral alNavegar={() => setMenu(false)} cerrar={() => setMenu(false)} />
          </aside>
        </div>
      )}

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 shrink-0 items-center justify-between border-b-4 border-black bg-gray-200 px-4 lg:hidden">
          <Logo />
          <button type="button" onClick={() => setMenu(true)} className="border-2 border-black bg-white p-2 brutal-btn" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {demo && (
          <div className="shrink-0 border-b-4 border-black bg-black px-4 py-1.5 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-white sm:px-8">
            Modo demostración · los expedientes mostrados son ficticios
          </div>
        )}

        <div ref={desplazable} className="flex-1 overflow-y-auto">
          <section ref={vista} className="flex flex-col p-4 sm:p-8">
            <Outlet />
          </section>
        </div>

        <footer className="z-20 hidden shrink-0 items-center gap-4 border-t-4 border-black bg-white p-5 md:flex">
          <div className="shrink-0 bg-black p-2 text-white shadow-[4px_4px_0px_0px_rgba(156,163,175,1)]">
            <Crosshair className="h-6 w-6" aria-hidden />
          </div>
          <div className="border-l-4 border-gray-300 pl-4">
            <h4 className="mb-1 text-xs font-black uppercase tracking-widest text-gray-500">Misión del Sistema S.A.R.A.</h4>
            <p className="text-sm font-bold leading-snug text-black">
              Lograr un mejoramiento esencial en la búsqueda de personas desaparecidas, brindando a la sociedad y a las instituciones un sistema tecnológico a la altura de la magnitud del problema.
            </p>
          </div>
        </footer>
      </main>

      <ExpedienteDetalle />
    </div>
  )
}
