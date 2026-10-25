export const MAX_BYTES = 10 * 1024 * 1024

export async function validarPdf(archivo) {
  if (!archivo.size) return 'El archivo está vacío.'
  if (archivo.size > MAX_BYTES) return 'Excede el tamaño máximo de 10 MB.'
  const cabecera = new Uint8Array(await archivo.slice(0, 5).arrayBuffer())
  const firma = String.fromCharCode(...cabecera)
  if (firma !== '%PDF-') return 'No es un PDF válido.'
  return null
}
