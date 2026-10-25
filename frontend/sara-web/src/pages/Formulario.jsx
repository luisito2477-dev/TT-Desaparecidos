import { useEffect, useState } from 'react'
import { LayoutTemplate, MapPin, Fingerprint, Save, Eraser, AlertTriangle, CheckCircle2, FileText } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ESTADOS } from '../lib/estados'
import { Cabecera } from '../components/ui'

const VACIO = {
  nombre: '',
  sexo: '',
  edadDesaparicion: '',
  edadActual: '',
  lugarNacimiento: '',
  nacionalidad: '',
  hablaEspanol: '',
  lenguaIndigena: '',
  discapacidad: '',
  fechaHechos: '',
  fechaPercato: '',
  estadoHechos: '',
  municipioHechos: '',
  autoridadReporte: '',
  caracteristicasFisicas: '',
  senasParticulares: '',
  prendasVestir: '',
}

function desdeExpediente(exp) {
  if (!exp) return VACIO
  const f = { ...VACIO }
  for (const k of Object.keys(VACIO)) {
    const v = exp[k]
    if (k === 'hablaEspanol') f[k] = v === true ? 'SI' : v === false ? 'NO' : ''
    else f[k] = v === null || v === undefined ? '' : String(v)
  }
  return f
}

function hacia(form, base) {
  const limpio = (v) => (v.trim() === '' ? null : v.trim().replace(/\s+/g, ' ').toUpperCase())
  const numero = (v) => (v === '' ? null : Number(v))
  return {
    ...base,
    nombre: limpio(form.nombre),
    sexo: form.sexo || null,
    edadDesaparicion: numero(form.edadDesaparicion),
    edadActual: numero(form.edadActual),
    lugarNacimiento: limpio(form.lugarNacimiento),
    nacionalidad: limpio(form.nacionalidad),
    hablaEspanol: form.hablaEspanol === 'SI' ? true : form.hablaEspanol === 'NO' ? false : null,
    lenguaIndigena: limpio(form.lenguaIndigena),
    discapacidad: limpio(form.discapacidad),
    fechaHechos: form.fechaHechos || null,
    fechaPercato: form.fechaPercato || null,
    estadoHechos: limpio(form.estadoHechos),
    municipioHechos: limpio(form.municipioHechos),
    autoridadReporte: limpio(form.autoridadReporte),
    caracteristicasFisicas: limpio(form.caracteristicasFisicas),
    senasParticulares: limpio(form.senasParticulares),
    prendasVestir: limpio(form.prendasVestir),
  }
}

function validar(f) {
  const errores = {}
  const hoy = new Date().toISOString().slice(0, 10)
  if (!f.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  for (const k of ['edadDesaparicion', 'edadActual']) {
    if (f[k] !== '' && (!Number.isInteger(Number(f[k])) || Number(f[k]) < 0 || Number(f[k]) > 120)) errores[k] = 'Debe ser un entero entre 0 y 120.'
  }
  if (!errores.edadActual && f.edadActual !== '' && f.edadDesaparicion !== '' && Number(f.edadActual) < Number(f.edadDesaparicion)) {
    errores.edadActual = 'No puede ser menor que la edad al desaparecer.'
  }
  for (const k of ['fechaHechos', 'fechaPercato']) {
    if (f[k] && f[k] > hoy) errores[k] = 'No puede ser una fecha futura.'
  }
  if (!errores.fechaPercato && f.fechaHechos && f.fechaPercato && f.fechaPercato < f.fechaHechos) {
    errores.fechaPercato = 'No puede ser anterior a la fecha de los hechos.'
  }
  return errores
}

function Campo({ id, etiqueta, error, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="etiqueta">
        {etiqueta}
      </label>
      {children}
      {error && (
        <p className="mt-2 flex items-center gap-1.5 font-mono text-xs font-bold">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

export default function Formulario() {
  const { borrador, setBorrador, guardarExpediente } = useApp()
  const [form, setForm] = useState(() => desdeExpediente(borrador))
  const [errores, setErrores] = useState({})
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    setForm(desdeExpediente(borrador))
    setErrores({})
    setAviso(null)
  }, [borrador])

  const cambiar = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setAviso(null)
    if (errores[k]) setErrores((er) => ({ ...er, [k]: undefined }))
  }

  const props = (k) => ({ id: `f-${k}`, value: form[k], onChange: cambiar(k), 'aria-invalid': !!errores[k] })
  const clase = (k, base = 'campo') => `${base} ${errores[k] ? 'bg-gray-100 border-dashed' : ''}`

  const guardarRegistro = (e) => {
    e.preventDefault()
    const er = validar(form)
    setErrores(er)
    if (Object.keys(er).length) {
      setAviso({ tipo: 'error', texto: `Hay ${Object.keys(er).length} campo(s) por corregir.` })
      const primero = Object.keys(VACIO).find((k) => er[k])
      document.getElementById(`f-${primero}`)?.focus()
      return
    }
    const guardado = guardarExpediente(hacia(form, borrador ?? {}))
    setBorrador(guardado)
    setAviso({ tipo: 'ok', texto: 'Registro guardado en este equipo. La sincronización con MS-Core estará disponible cuando exista el endpoint de edición.' })
  }

  const limpiar = () => {
    setBorrador(null)
    setForm(VACIO)
    setErrores({})
    setAviso(null)
  }

  return (
    <>
      <Cabecera titulo="Registro Estructurado" descripcion="Revisión y corrección de los campos de la ficha, incluido el registro de señas particulares." />

      <form className="panel mb-8 shrink-0" onSubmit={guardarRegistro} noValidate>
        <div className="flex items-center gap-2 border-b-4 border-black bg-gray-50 px-6 py-3 font-mono text-xs font-bold sm:px-8">
          <FileText className="h-4 w-4 shrink-0" />
          {borrador
            ? `ORIGEN: ${borrador.origen ?? borrador.nombre ?? 'EXPEDIENTE'}${borrador.demo ? ' · FICTICIO' : ''}`
            : 'CAPTURA MANUAL · O ABRE UNA FICHA DESDE EXTRACCIÓN PARA CORREGIR SUS DATOS'}
        </div>

        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="separador-seccion">
            <LayoutTemplate className="h-5 w-5" aria-hidden /> Datos Generales
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Campo id="f-nombre" etiqueta="Nombre de la víctima" error={errores.nombre} className="md:col-span-2">
              <input {...props('nombre')} type="text" className={clase('nombre')} placeholder="Ej. Juan Pérez" />
            </Campo>
            <Campo id="f-sexo" etiqueta="Sexo">
              <select {...props('sexo')} className="campo">
                <option value="">Sin dato</option>
                <option value="HOMBRE">Hombre</option>
                <option value="MUJER">Mujer</option>
              </select>
            </Campo>
            <Campo id="f-nacionalidad" etiqueta="Nacionalidad">
              <input {...props('nacionalidad')} type="text" className="campo" placeholder="Ej. Mexicana" />
            </Campo>
            <Campo id="f-edadDesaparicion" etiqueta="Edad al desaparecer" error={errores.edadDesaparicion}>
              <input {...props('edadDesaparicion')} type="number" min="0" max="120" className={clase('edadDesaparicion')} placeholder="Años" />
            </Campo>
            <Campo id="f-edadActual" etiqueta="Edad actual" error={errores.edadActual}>
              <input {...props('edadActual')} type="number" min="0" max="120" className={clase('edadActual')} placeholder="Años" />
            </Campo>
            <Campo id="f-lugarNacimiento" etiqueta="Lugar de nacimiento">
              <input {...props('lugarNacimiento')} type="text" className="campo" placeholder="Ej. Jalisco" />
            </Campo>
            <Campo id="f-hablaEspanol" etiqueta="¿Habla español?">
              <select {...props('hablaEspanol')} className="campo">
                <option value="">Sin dato</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </Campo>
            <Campo id="f-lenguaIndigena" etiqueta="Lengua indígena">
              <input {...props('lenguaIndigena')} type="text" className="campo" placeholder="Ej. Náhuatl" />
            </Campo>
            <Campo id="f-discapacidad" etiqueta="Discapacidad">
              <input {...props('discapacidad')} type="text" className="campo" placeholder="Ej. Auditiva" />
            </Campo>
          </div>

          <hr className="my-4 border-2 border-black" />

          <div className="separador-seccion">
            <MapPin className="h-5 w-5" aria-hidden /> Datos de los Hechos
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Campo id="f-fechaHechos" etiqueta="Fecha de los hechos" error={errores.fechaHechos}>
              <input {...props('fechaHechos')} type="date" className={clase('fechaHechos')} />
            </Campo>
            <Campo id="f-fechaPercato" etiqueta="Fecha en que se percató" error={errores.fechaPercato}>
              <input {...props('fechaPercato')} type="date" className={clase('fechaPercato')} />
            </Campo>
            <Campo id="f-estadoHechos" etiqueta="Entidad / Estado">
              <input {...props('estadoHechos')} type="text" list="lista-estados" className="campo" placeholder="Ej. Estado de México" />
              <datalist id="lista-estados">
                {ESTADOS.map((e) => (
                  <option key={e.clave} value={e.nombre.toUpperCase()} />
                ))}
              </datalist>
            </Campo>
            <Campo id="f-municipioHechos" etiqueta="Municipio">
              <input {...props('municipioHechos')} type="text" className="campo" placeholder="Ej. Ecatepec" />
            </Campo>
            <Campo id="f-autoridadReporte" etiqueta="Autoridad que ingresó el reporte" className="md:col-span-2">
              <input {...props('autoridadReporte')} type="text" className="campo" placeholder="Ej. Fiscalía del Estado" />
            </Campo>
          </div>

          <hr className="my-4 border-2 border-black" />

          <div>
            <p className="titulo-seccion">
              <Fingerprint className="h-5 w-5" aria-hidden /> Tatuajes, Señas Particulares y Datos Importantes
            </p>
            <div className="space-y-6">
              <Campo id="f-senasParticulares" etiqueta="Señas particulares">
                <textarea {...props('senasParticulares')} className="campo-largo min-h-[120px]" placeholder="Describe tatuajes, cicatrices, lunares o cualquier seña clave del caso..." />
              </Campo>
              <Campo id="f-caracteristicasFisicas" etiqueta="Características físicas">
                <textarea {...props('caracteristicasFisicas')} className="campo-largo min-h-[100px]" placeholder="Complexión, tez, cabello, ojos, estatura, peso..." />
              </Campo>
              <Campo id="f-prendasVestir" etiqueta="Prendas de vestir">
                <textarea {...props('prendasVestir')} className="campo-largo min-h-[100px]" placeholder="Ropa y calzado que vestía al momento de los hechos..." />
              </Campo>
            </div>
          </div>
        </div>

        {aviso && (
          <div className={`mx-6 mb-6 flex items-start gap-3 border-4 border-black p-4 font-bold sm:mx-8 ${aviso.tipo === 'ok' ? 'bg-black text-white' : 'bg-white'}`} role="status">
            {aviso.tipo === 'ok' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
            {aviso.texto}
          </div>
        )}

        <div className="pie-panel flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-blanco" onClick={limpiar}>
            <Eraser className="h-4 w-4" /> Limpiar
          </button>
          <button type="submit" className="btn-negro px-12 py-4">
            <Save className="h-5 w-5" /> Guardar Registro
          </button>
        </div>
      </form>
    </>
  )
}
