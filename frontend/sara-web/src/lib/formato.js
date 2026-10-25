export function normalizar(texto) {
  return (texto ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim()
}

export function fecha(iso) {
  if (!iso) return null
  const [a, m, d] = iso.split('-')
  if (!a || !m || !d) return iso
  return `${d}/${m}/${a}`
}

export function tamano(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function titulo(texto) {
  if (!texto) return texto
  return texto
    .toLowerCase()
    .replace(/(^|\s|-)([a-záéíóúñü])/g, (_, s, l) => s + l.toUpperCase())
    .replace(/\b(De|Del|La|Las|Los|Y)\b/g, (p) => p.toLowerCase())
}

export function iniciales(nombre) {
  if (!nombre) return '?'
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[partes.length > 2 ? 2 : 1]?.[0] ?? '')).toUpperCase()
}

export const CAMPOS = [
  { clave: 'nombre', etiqueta: 'Nombre', grupo: 'generales' },
  { clave: 'sexo', etiqueta: 'Sexo', grupo: 'generales' },
  { clave: 'edadDesaparicion', etiqueta: 'Edad al desaparecer', grupo: 'generales', sufijo: ' años' },
  { clave: 'edadActual', etiqueta: 'Edad actual', grupo: 'generales', sufijo: ' años' },
  { clave: 'lugarNacimiento', etiqueta: 'Lugar de nacimiento', grupo: 'generales' },
  { clave: 'nacionalidad', etiqueta: 'Nacionalidad', grupo: 'generales' },
  { clave: 'hablaEspanol', etiqueta: '¿Habla español?', grupo: 'generales', booleano: true },
  { clave: 'lenguaIndigena', etiqueta: 'Lengua indígena', grupo: 'generales' },
  { clave: 'discapacidad', etiqueta: 'Discapacidad', grupo: 'generales' },
  { clave: 'fechaHechos', etiqueta: 'Fecha de los hechos', grupo: 'hechos', fecha: true },
  { clave: 'fechaPercato', etiqueta: 'Fecha en que se percató', grupo: 'hechos', fecha: true },
  { clave: 'estadoHechos', etiqueta: 'Estado', grupo: 'hechos' },
  { clave: 'municipioHechos', etiqueta: 'Municipio', grupo: 'hechos' },
  { clave: 'autoridadReporte', etiqueta: 'Autoridad que reportó', grupo: 'hechos' },
  { clave: 'caracteristicasFisicas', etiqueta: 'Características físicas', grupo: 'descripcion', largo: true },
  { clave: 'senasParticulares', etiqueta: 'Señas particulares', grupo: 'descripcion', largo: true },
  { clave: 'prendasVestir', etiqueta: 'Prendas de vestir', grupo: 'descripcion', largo: true },
]

export function valorCampo(campo, exp) {
  const v = exp?.[campo.clave]
  if (v === null || v === undefined || v === '') return null
  if (campo.booleano) return v ? 'Sí' : 'No'
  if (campo.fecha) return fecha(v)
  return `${v}${campo.sufijo ?? ''}`
}

export function completitud(exp) {
  if (!exp) return 0
  const llenos = CAMPOS.filter((c) => valorCampo(c, exp) !== null).length
  return llenos / CAMPOS.length
}
