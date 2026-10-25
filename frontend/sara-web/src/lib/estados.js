import { normalizar } from './formato'

export const ESTADOS = [
  { clave: 'BC', nombre: 'Baja California', col: 0, fila: 0, alias: ['BAJA CALIFORNIA'] },
  { clave: 'SON', nombre: 'Sonora', col: 1, fila: 0, alias: ['SONORA'] },
  { clave: 'CHIH', nombre: 'Chihuahua', col: 2, fila: 0, alias: ['CHIHUAHUA'] },
  { clave: 'COAH', nombre: 'Coahuila', col: 3, fila: 0, alias: ['COAHUILA'] },
  { clave: 'NL', nombre: 'Nuevo León', col: 4, fila: 0, alias: ['NUEVO LEON'] },
  { clave: 'BCS', nombre: 'Baja California Sur', col: 0, fila: 1, alias: ['BAJA CALIFORNIA SUR'] },
  { clave: 'SIN', nombre: 'Sinaloa', col: 1, fila: 1, alias: ['SINALOA'] },
  { clave: 'DGO', nombre: 'Durango', col: 2, fila: 1, alias: ['DURANGO'] },
  { clave: 'ZAC', nombre: 'Zacatecas', col: 3, fila: 1, alias: ['ZACATECAS'] },
  { clave: 'TAMPS', nombre: 'Tamaulipas', col: 4, fila: 1, alias: ['TAMAULIPAS'] },
  { clave: 'NAY', nombre: 'Nayarit', col: 1, fila: 2, alias: ['NAYARIT'] },
  { clave: 'JAL', nombre: 'Jalisco', col: 2, fila: 2, alias: ['JALISCO'] },
  { clave: 'AGS', nombre: 'Aguascalientes', col: 3, fila: 2, alias: ['AGUASCALIENTES'] },
  { clave: 'SLP', nombre: 'San Luis Potosí', col: 4, fila: 2, alias: ['SAN LUIS POTOSI'] },
  { clave: 'COL', nombre: 'Colima', col: 1, fila: 3, alias: ['COLIMA'] },
  { clave: 'MICH', nombre: 'Michoacán', col: 2, fila: 3, alias: ['MICHOACAN'] },
  { clave: 'GTO', nombre: 'Guanajuato', col: 3, fila: 3, alias: ['GUANAJUATO'] },
  { clave: 'QRO', nombre: 'Querétaro', col: 4, fila: 3, alias: ['QUERETARO'] },
  { clave: 'HGO', nombre: 'Hidalgo', col: 5, fila: 3, alias: ['HIDALGO'] },
  { clave: 'GRO', nombre: 'Guerrero', col: 2, fila: 4, alias: ['GUERRERO'] },
  { clave: 'MEX', nombre: 'Estado de México', col: 3, fila: 4, alias: ['ESTADO DE MEXICO', 'MEXICO'] },
  { clave: 'CDMX', nombre: 'Ciudad de México', col: 4, fila: 4, alias: ['CIUDAD DE MEXICO', 'DISTRITO FEDERAL', 'CDMX'] },
  { clave: 'TLAX', nombre: 'Tlaxcala', col: 5, fila: 4, alias: ['TLAXCALA'] },
  { clave: 'VER', nombre: 'Veracruz', col: 6, fila: 4, alias: ['VERACRUZ'] },
  { clave: 'MOR', nombre: 'Morelos', col: 3, fila: 5, alias: ['MORELOS'] },
  { clave: 'PUE', nombre: 'Puebla', col: 4, fila: 5, alias: ['PUEBLA'] },
  { clave: 'OAX', nombre: 'Oaxaca', col: 5, fila: 5, alias: ['OAXACA'] },
  { clave: 'TAB', nombre: 'Tabasco', col: 6, fila: 5, alias: ['TABASCO'] },
  { clave: 'CAMP', nombre: 'Campeche', col: 7, fila: 5, alias: ['CAMPECHE'] },
  { clave: 'YUC', nombre: 'Yucatán', col: 8, fila: 5, alias: ['YUCATAN'] },
  { clave: 'CHIS', nombre: 'Chiapas', col: 6, fila: 6, alias: ['CHIAPAS'] },
  { clave: 'QROO', nombre: 'Quintana Roo', col: 8, fila: 6, alias: ['QUINTANA ROO'] },
]

const ALIAS = ESTADOS.flatMap((e) => e.alias.map((a) => [a, e.clave])).sort((a, b) => b[0].length - a[0].length)

export function claveEstado(texto) {
  const n = normalizar(texto)
  if (!n) return null
  return ALIAS.find(([alias]) => n.includes(alias))?.[1] ?? null
}

export function nombreEstado(clave) {
  return ESTADOS.find((e) => e.clave === clave)?.nombre ?? clave
}

export function contarPorEstado(expedientes) {
  const conteo = Object.fromEntries(ESTADOS.map((e) => [e.clave, 0]))
  let sinEstado = 0
  for (const exp of expedientes) {
    const clave = claveEstado(exp.estadoHechos)
    if (clave) conteo[clave] += 1
    else sinEstado += 1
  }
  return { conteo, sinEstado }
}
