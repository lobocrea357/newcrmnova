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

  // Dimensiones del PDF (A4: 210mm x 297mm)
  const PDF_WIDTH = 210
  const PDF_HEIGHT = 297
  const MARGIN = 15 // Margen de 15mm
  const contentHeightMM = PDF_HEIGHT - (MARGIN * 2)

  // Lógica para evitar cortes en secciones (pdf-section)
  // 1. Calcular factor de conversión px a mm
  // El PdfContent tiene un ancho fijo de 800px en el componente
  const elementWidthPx = elemento.offsetWidth || 800
  const pxToMm = (PDF_WIDTH - (MARGIN * 2)) / elementWidthPx
  const contentHeightPx = contentHeightMM / pxToMm

  // 2. Identificar secciones y añadir espaciadores si es necesario
  const secciones = elemento.querySelectorAll('.pdf-section')
  let accumulatedHeight = 0
  
  secciones.forEach((seccion) => {
    // Eliminar espaciadores previos si existen
    const previo = seccion.previousElementSibling
    if (previo && previo.classList.contains('pdf-spacer')) {
      previo.remove()
    }

    const rect = seccion.getBoundingClientRect()
    const heightPx = rect.height
    const offsetTop = seccion.offsetTop

    // ¿La sección cruza el límite de la página actual?
    const spaceUsedInCurrentPage = offsetTop % contentHeightPx
    if (spaceUsedInCurrentPage + heightPx > contentHeightPx) {
      // Insertar espaciador para empujar a la siguiente página
      const spacer = document.createElement('div')
      spacer.className = 'pdf-spacer'
      spacer.style.height = `${contentHeightPx - spaceUsedInCurrentPage}px`
      seccion.parentNode.insertBefore(spacer, seccion)
    }
  })

  // 3. Recalcular la altura total después de añadir espaciadores
  const finalCanvasConfig = {
    ...canvasConfig,
    windowHeight: elemento.scrollHeight
  }

  // Generar canvas de alta calidad (después de añadir espaciadores)
  const canvas = await html2canvas(elemento, finalCanvasConfig)
  
  // Dimensiones de contenido para el PDF
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

  // Función para limpiar márgenes (evitar que se vea contenido fuera del área imprimible)
  const cleanMargins = () => {
    // Margen superior
    pdf.setFillColor('#ffffff')
    pdf.rect(0, 0, PDF_WIDTH, MARGIN, 'F')
    // Margen inferior
    pdf.rect(0, PDF_HEIGHT - MARGIN, PDF_WIDTH, MARGIN, 'F')
  }

  // Primera página - mostrar desde el inicio
  pdf.addImage(imgData, 'PNG', MARGIN, position, imgWidth, imgHeight, undefined, 'FAST')
  cleanMargins()
  heightLeft -= contentHeight

  // Páginas adicionales - desplazar imagen hacia arriba para mostrar siguiente sección
  while (heightLeft > 0) {
    position -= contentHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', MARGIN, position, imgWidth, imgHeight, undefined, 'FAST')
    cleanMargins()
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
