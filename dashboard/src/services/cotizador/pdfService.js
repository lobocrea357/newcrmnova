import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

/**
 * Configuración por defecto para html2canvas
 * scale: 3 para mayor calidad en PDFs profesionales
 */
const CANVAS_CONFIG = {
  scale: 3,
  useCORS: true,
  logging: false,
  backgroundColor: '#ffffff',
  windowWidth: 1200,
  allowTaint: false,
  imageTimeout: 15000
}

/**
 * Generar PDF desde un elemento DOM con manejo elegante de múltiples páginas
 * 
 * Estrategia:
 * - Captura el contenido completo como imagen de alta calidad
 * - Divide en páginas A4 respetando el diseño original
 * - Mantiene márgenes consistentes en todas las páginas
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

  // Generar canvas de alta calidad
  const canvas = await html2canvas(elemento, canvasConfig)

  // Dimensiones del PDF (A4: 210mm x 297mm)
  const PDF_WIDTH = 210
  const PDF_HEIGHT = 297
  const MARGIN = 15 // Margen de 15mm para evitar cortes en los bordes
  
  const contentWidth = PDF_WIDTH - (MARGIN * 2)
  const contentHeight = PDF_HEIGHT - (MARGIN * 2)
  
  // Calcular proporciones
  const imgWidth = contentWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  
  // Convertir canvas a imagen
  const imgData = canvas.toDataURL('image/png', 1.0)

  // Crear PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  })
  
  // Variables para paginación
  let heightLeft = imgHeight
  let position = MARGIN

  // Primera página - mostrar desde el inicio
  pdf.addImage(imgData, 'PNG', MARGIN, position, imgWidth, imgHeight, undefined, 'FAST')
  heightLeft -= contentHeight

  // Páginas adicionales - desplazar imagen hacia arriba para mostrar siguiente sección
  while (heightLeft > 0) {
    position -= contentHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', MARGIN, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= contentHeight
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
