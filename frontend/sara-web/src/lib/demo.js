import { normalizar } from './formato'
import { ESTADOS, claveEstado } from './estados'

function generador(semilla) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NOMBRES_H = ['ALAN', 'BRUNO', 'CESAR', 'DIEGO', 'EMILIO', 'FAUSTO', 'GAEL', 'HUGO', 'IVAN', 'JOEL', 'KEVIN', 'LEONEL', 'MATEO', 'NOE', 'OSCAR', 'RAUL']
const NOMBRES_M = ['ABRIL', 'BRENDA', 'CAROLINA', 'DANIELA', 'ELENA', 'FERNANDA', 'GISELA', 'IRENE', 'JIMENA', 'KARLA', 'LUCIA', 'MARIANA', 'NADIA', 'PAOLA', 'RENATA', 'SOFIA']
const APELLIDOS = ['ARANDA', 'BECERRA', 'CORONA', 'DELGADO', 'ESPARZA', 'FIERRO', 'GALINDO', 'IBARRA', 'LANDA', 'MEDRANO', 'NAVA', 'OCHOA', 'PADILLA', 'QUIROZ', 'ROBLES', 'SALAZAR', 'TAPIA', 'URIBE', 'VALDEZ', 'ZAMORA']
const COMPLEXION = ['DELGADA', 'MEDIANA', 'ROBUSTA', 'ATLETICA']
const TEZ = ['BLANCA', 'MORENA CLARA', 'MORENA', 'MORENA OSCURA']
const CABELLO = ['NEGRO CORTO LACIO', 'CASTAÑO LARGO ONDULADO', 'NEGRO LARGO LACIO', 'CASTAÑO CLARO CORTO', 'RAPADO', 'NEGRO RIZADO']
const OJOS = ['CAFES OSCUROS', 'CAFES CLAROS', 'NEGROS', 'VERDES']
const SENAS = [
  'TATUAJE DE ROSA EN ANTEBRAZO DERECHO',
  'CICATRIZ EN CEJA IZQUIERDA',
  'TATUAJE DE COLIBRI EN EL PECHO',
  'LUNAR EN MEJILLA DERECHA',
  'TATUAJE CON LA PALABRA MAMA EN BRAZO IZQUIERDO',
  'CICATRIZ QUIRURGICA EN ABDOMEN',
  'PERFORACION EN CEJA DERECHA',
  'TATUAJE DE CRUZ EN MANO IZQUIERDA',
  'MANCHA DE NACIMIENTO EN CUELLO',
  'TATUAJE DE ALAS EN LA ESPALDA',
  null,
  null,
]
const PRENDAS = [
  'PLAYERA ROJA, PANTALON DE MEZCLILLA AZUL Y TENIS BLANCOS',
  'SUDADERA GRIS CON CAPUCHA, PANTS NEGRO',
  'BLUSA BLANCA, FALDA AZUL MARINO Y ZAPATOS NEGROS',
  'CHAMARRA DE PIEL NEGRA, JEANS Y BOTAS CAFES',
  'UNIFORME ESCOLAR VERDE CON BLANCO',
  'CAMISA A CUADROS, PANTALON DE VESTIR GRIS',
  'VESTIDO AMARILLO Y SANDALIAS',
  null,
]
const MUNICIPIOS = ['CENTRO', 'SAN JUAN', 'SANTA MARIA', 'SAN PEDRO', 'GUADALUPE', 'JUAREZ', 'HIDALGO', 'VICTORIA']

function elegir(azar, lista) {
  return lista[Math.floor(azar() * lista.length)]
}

function guid(azar) {
  const h = (n) => Array.from({ length: n }, () => Math.floor(azar() * 16).toString(16)).join('').toUpperCase()
  return `${h(8)}-${h(4)}-4${h(3)}-${h(4)}-${h(12)}`
}

function fechaIso(azar, desde, hasta) {
  const t = desde + azar() * (hasta - desde)
  return new Date(t).toISOString().slice(0, 10)
}

function generarExpedientes(cantidad) {
  const azar = generador(20261025)
  const pesos = ESTADOS.map((e) => (['JAL', 'MEX', 'TAMPS', 'VER', 'NL', 'SON', 'GTO', 'CDMX', 'MICH', 'ZAC'].includes(e.clave) ? 4 : 1))
  const total = pesos.reduce((a, b) => a + b, 0)
  const estadoAleatorio = () => {
    let r = azar() * total
    for (let i = 0; i < ESTADOS.length; i++) {
      r -= pesos[i]
      if (r <= 0) return ESTADOS[i]
    }
    return ESTADOS[0]
  }

  return Array.from({ length: cantidad }, (_, i) => {
    const hombre = azar() < 0.62
    const nombre = `${elegir(azar, hombre ? NOMBRES_H : NOMBRES_M)} ${elegir(azar, APELLIDOS)} ${elegir(azar, APELLIDOS)}`
    const edad = 12 + Math.floor(azar() * 48)
    const fechaHechos = fechaIso(azar, Date.UTC(2014, 0, 1), Date.UTC(2026, 8, 30))
    const anios = new Date().getUTCFullYear() - Number(fechaHechos.slice(0, 4))
    const estado = estadoAleatorio()
    const estatura = (1.5 + azar() * 0.35).toFixed(2)
    const peso = 48 + Math.floor(azar() * 45)
    const vector = azar() < 0.9

    return {
      id: `demo-${i + 1}`,
      folio: guid(azar),
      demo: true,
      nombre,
      sexo: hombre ? 'HOMBRE' : 'MUJER',
      edadDesaparicion: edad,
      edadActual: edad + anios,
      lugarNacimiento: azar() < 0.8 ? estado.nombre.toUpperCase() : null,
      nacionalidad: 'MEXICANA',
      hablaEspanol: azar() < 0.97,
      lenguaIndigena: azar() < 0.06 ? 'NAHUATL' : null,
      discapacidad: azar() < 0.05 ? 'AUDITIVA' : null,
      fechaHechos,
      fechaPercato: fechaHechos,
      estadoHechos: estado.nombre.toUpperCase(),
      municipioHechos: azar() < 0.85 ? elegir(azar, MUNICIPIOS) : null,
      autoridadReporte: `FISCALIA DEL ESTADO DE ${estado.nombre.toUpperCase()}`,
      caracteristicasFisicas: `COMPLEXION ${elegir(azar, COMPLEXION)}, TEZ ${elegir(azar, TEZ)}, CABELLO ${elegir(azar, CABELLO)}, OJOS ${elegir(azar, OJOS)}, ESTATURA ${estatura} M, PESO ${peso} KG`,
      senasParticulares: elegir(azar, SENAS),
      prendasVestir: elegir(azar, PRENDAS),
      embeddingData: vector ? { dimension: 384, transformerModel: 'paraphrase-multilingual-MiniLM-L12-v2' } : null,
    }
  })
}

export const EXPEDIENTES_DEMO = generarExpedientes(240)

const VACIAS = new Set(['CON', 'UNA', 'UNO', 'LOS', 'LAS', 'DEL', 'QUE', 'POR', 'PARA', 'SUS', 'TIENE', 'TENIA', 'LLEVABA', 'PERSONA'])
const SINONIMOS = {
  TATUAJE: ['TATUAJE', 'TATUADO'],
  MUJER: ['MUJER', 'FEMENINO', 'CHICA', 'SENORA', 'NINA'],
  HOMBRE: ['HOMBRE', 'MASCULINO', 'CHICO', 'SENOR', 'NINO', 'JOVEN'],
}

function terminos(texto) {
  return normalizar(texto)
    .replace(/[^A-Z0-9Ñ ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !VACIAS.has(t))
}

export function buscarDemo({ textoBusqueda, sexo, estado, edadMin, edadMax, desde, hasta }) {
  const consulta = terminos(textoBusqueda)
  let sexoConsulta = sexo || null
  if (!sexoConsulta) {
    if (consulta.some((t) => SINONIMOS.MUJER.includes(t))) sexoConsulta = 'MUJER'
    else if (consulta.some((t) => SINONIMOS.HOMBRE.includes(t))) sexoConsulta = 'HOMBRE'
  }
  const utiles = consulta.filter((t) => !SINONIMOS.MUJER.includes(t) && !SINONIMOS.HOMBRE.includes(t))

  return EXPEDIENTES_DEMO.filter((e) => {
    if (sexoConsulta && e.sexo !== sexoConsulta) return false
    if (estado && claveEstado(e.estadoHechos) !== estado) return false
    if (edadMin !== '' && edadMin != null && e.edadDesaparicion < Number(edadMin)) return false
    if (edadMax !== '' && edadMax != null && e.edadDesaparicion > Number(edadMax)) return false
    if (desde && e.fechaHechos < desde) return false
    if (hasta && e.fechaHechos > hasta) return false
    return true
  })
    .map((e) => {
      const documento = terminos(`${e.caracteristicasFisicas} ${e.senasParticulares ?? ''} ${e.prendasVestir ?? ''}`)
      if (!utiles.length) return { expediente: e, similitud: 0.5, terminos: [] }
      let puntos = 0
      const encontrados = []
      for (const t of utiles) {
        if (documento.includes(t)) {
          puntos += 1
          encontrados.push(t)
        } else if (t.length > 4 && documento.some((d) => d.startsWith(t.slice(0, 5)))) {
          puntos += 0.6
          encontrados.push(t.slice(0, 5))
        }
      }
      if (!puntos) return { expediente: e, similitud: 0, terminos: [] }
      const variacion = (hash(e.folio) % 90) / 1000
      return { expediente: e, similitud: 0.42 + 0.5 * (puntos / utiles.length) - variacion, terminos: encontrados }
    })
    .filter((r) => r.similitud > 0)
    .sort((a, b) => b.similitud - a.similitud)
    .slice(0, 12)
}

function hash(texto) {
  let h = 2166136261
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function extraccionDemo(nombreArchivo) {
  const base = EXPEDIENTES_DEMO[hash(nombreArchivo) % EXPEDIENTES_DEMO.length]
  return { ...base, id: `demo-ingesta-${hash(nombreArchivo + Date.now())}` }
}
