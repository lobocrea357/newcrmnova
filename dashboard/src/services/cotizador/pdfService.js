import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

/**
 * Configuración por defecto para html2canvas
 */
const CANVAS_CONFIG = {
  scale: 2,
  useCORS: true,
  logging: false,
  backgroundColor: '#ffffff',
  windowWidth: 1200
}

/**
 * Generar PDF desde un elemento DOM
 */
export async function generarPdfDesdeElemento(elemento, opciones = {}) {
  if (!elemento) {
    throw new Error('Elemento DOM no proporcionado')
  }

  // Configuración personalizable
  const canvasConfig = {
    ...CANVAS_CONFIG,
    windowHeight: elemento.scrollHeight,
    ...opciones.canvasConfig
  }

  // Generar canvas
  const canvas = await html2canvas(elemento, canvasConfig)

  // Dimensiones del PDF
  const imgWidth = 210 // A4 width en mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const imgData = canvas.toDataURL('image/png')

  // Crear PDF
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // Manejar páginas múltiples
  let heightLeft = imgHeight
  let position = 0
  const pageHeight = 297 // A4 height en mm

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  return pdf
}

/**
 * Generar nombre de archivo para cotización
 */
export function generarNombrePDF({ origen, destino, fecha = new Date() }) {
  const fechaStr = fecha.toISOString().split('T')[0]
  const origenStr = origen?.replace(/\s+/g, '_') || 'SinOrigen'
  const destinoStr = destino?.replace(/\s+/g, '_') || 'SinDestino'
  
  return `Cotizacion_${origenStr}_${destinoStr}_${fechaStr}.pdf`
}

/**
 * Exportar cotización como PDF
 */
export async function exportarCotizacionPDF(elemento, { origen, destino }) {
  const pdf = await generarPdfDesdeElemento(elemento)
  const nombreArchivo = generarNombrePDF({ origen, destino })
  pdf.save(nombreArchivo)
  
  return nombreArchivo
}
