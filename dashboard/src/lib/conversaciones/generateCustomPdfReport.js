// dashboard/src/lib/conversaciones/generateCustomPdfReport.js
import { jsPDF } from 'jspdf'
import { parseBotSessionName } from '@/lib/botNameParser'

/**
 * Paleta de colores ejecutiva (Viajes Nova)
 */
const NAVY   = [15,  31,  72]
const BLUE   = [30,  80, 180]
const GOLD   = [180, 140, 30]
const GREEN  = [22, 163, 104]
const ORANGE = [234, 130, 20]
const RED    = [210,  40,  40]
const G1     = [20,  20,  20]
const G2     = [60,  60,  60]
const G3     = [110, 110, 110]
const G4     = [190, 195, 205]
const G5     = [238, 240, 244]
const WHITE  = [255, 255, 255]

const scoreColor = s => s >= 8 ? GREEN : s >= 6 ? ORANGE : RED
const scoreBg    = s => s >= 8 ? [230, 248, 240] : s >= 6 ? [255, 243, 215] : [254, 226, 226]

/**
 * Genera el reporte PDF ejecutivo personalizado
 * @param {Object} reportData - Datos estructurados retornados por la API de IA
 * @param {Object} metadata - Parámetros de la consulta (userPrompt, timeframe, etc.)
 */
export function generateCustomPdfReport(reportData, metadata = {}) {
  if (!reportData || typeof reportData !== 'object') {
    console.error('generateCustomPdfReport: payload inválido', reportData)
    return
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const IX = 16
  const CW = PW - IX * 2
  let Y = 0
  let pageNum = 1

  const drawPageFooter = () => {
    doc.setFillColor(...G5)
    doc.rect(0, PH - 9, PW, 9, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...G3)
    doc.text('CONFIDENCIAL · REPORTE PERSONALIZADO DE AUDITORÍA · VIAJES NOVA', IX, PH - 3.5)
    doc.setFont('helvetica', 'bold')
    doc.text(`Página ${pageNum}`, PW - IX, PH - 3.5, { align: 'right' })
  }

  const newPage = () => {
    drawPageFooter()
    doc.addPage()
    pageNum++
    Y = 16
  }

  const need = space => {
    if (Y + space > PH - 14) newPage()
  }

  const hLine = (x1, x2, y, color = G4, lw = 0.2) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(lw)
    doc.line(x1, y, x2, y)
  }

  const narrative = reportData.aiNarrative || reportData
  const title = narrative.title || 'INFORME PERSONALIZADO DE AUDITORÍA COMERCIAL'
  const summary = narrative.executiveSummary || narrative.summary || 'Sin resumen disponible'
  const generalScore = Number(narrative.generalScore || narrative.score || 0)
  const advisors = narrative.advisors || []
  const totalAnalyzed = narrative.totalAnalyzed || reportData.summary?.totalChats || 0
  const recommendations = narrative.strategicRecommendations || narrative.recommendations || []
  const timeframeLabel = metadata.timeframe || 'Período seleccionado'
  const userPrompt = metadata.userPrompt || 'Evaluación comercial integral'

  /* ══════════════════════════════════════════════════════
     PÁGINA 1 – PORTADA Y RESUMEN ESTRATÉGICO
  ══════════════════════════════════════════════════════ */

  // Banda Superior NAVY
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PW, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...WHITE)
  doc.text('VIAJES NOVA', IX, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(180, 200, 240)
  doc.text('Dirección de Auditoría e Inteligencia Comercial', IX, 17)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...WHITE)
  doc.text('REPORTE PERSONALIZADO CON IA', PW - IX, 12, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(180, 200, 240)
  doc.text(`${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}  ·  ${timeframeLabel}`, PW - IX, 18, { align: 'right' })

  // Línea dorada divisoria
  doc.setFillColor(...GOLD)
  doc.rect(0, 38, PW, 1.5, 'F')

  // Bloque de Título y Objetivo
  Y = 48
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...G3)
  doc.text('OBJETIVO / REQUERIMIENTO DEL ADMINISTRADOR:', IX, Y)
  Y += 5.5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...G1)
  const titleLines = doc.splitTextToSize(title, CW)
  titleLines.forEach(l => {
    doc.text(l, IX, Y)
    Y += 6
  })

  // Cuadro con la instrucción original del admin
  Y += 2
  doc.setFillColor(246, 248, 252)
  doc.setDrawColor(210, 220, 238)
  doc.setLineWidth(0.3)
  const promptLines = doc.splitTextToSize(`" ${userPrompt} "`, CW - 12)
  const promptH = Math.max(12, promptLines.length * 4 + 7)
  doc.roundedRect(IX, Y, CW, promptH, 2, 2, 'FD')

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...BLUE)
  let pY = Y + 5
  promptLines.forEach(pl => {
    doc.text(pl, IX + 6, pY)
    pY += 4
  })

  Y += promptH + 8
  hLine(IX, PW - IX, Y, G4, 0.4)
  Y += 8

  // 4 KPIs de Resumen
  const BW = (CW - 9) / 4
  const advisorCount = advisors.length
  const totalSales = advisors.reduce((acc, a) => acc + (a.salesCount || 0), 0)

  const KPI_BOXES = [
    { label: 'SCORE GENERAL', val: generalScore ? `${generalScore.toFixed(1)}/10` : 'N/A', sub: 'Calidad global', color: scoreColor(generalScore), bg: scoreBg(generalScore) },
    { label: 'ASESORES AUDITADOS', val: String(advisorCount), sub: 'Sesiones WAHA', color: BLUE, bg: [234, 242, 255] },
    { label: 'CHATS ANALIZADOS', val: String(totalAnalyzed), sub: 'Muestra evaluada', color: NAVY, bg: G5 },
    { label: 'VENTAS CONFIRMADAS', val: String(totalSales), sub: 'En chats auditados', color: GREEN, bg: [230, 248, 240] }
  ]

  KPI_BOXES.forEach((b, i) => {
    const bx = IX + i * (BW + 3)
    doc.setFillColor(...b.bg)
    doc.setDrawColor(...G4)
    doc.roundedRect(bx, Y, BW, 23, 2, 2, 'FD')
    doc.setFillColor(...b.color)
    doc.roundedRect(bx, Y, BW, 2.5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...b.color)
    doc.text(b.label, bx + BW / 2, Y + 6.5, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...b.color)
    doc.text(b.val, bx + BW / 2, Y + 15, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(...G3)
    doc.text(b.sub, bx + BW / 2, Y + 20, { align: 'center' })
  })

  Y += 31

  // Resumen Ejecutivo de la IA
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...G1)
  doc.text('RESUMEN EJECUTIVO Y HALLAZGOS PRINCIPALES', IX, Y)
  doc.setFillColor(...BLUE)
  doc.rect(IX, Y + 1.5, 75, 0.8, 'F')
  Y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...G2)
  const summaryLines = doc.splitTextToSize(summary, CW)
  summaryLines.forEach(sl => {
    need(5)
    doc.text(sl, IX, Y)
    Y += 4.2
  })

  Y += 6

  // Tabla Comparativa de Asesores (si hay varios)
  if (advisors.length > 0) {
    need(30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...G1)
    doc.text('TABLA COMPARATIVA DE ASESORES', IX, Y)
    doc.setFillColor(...BLUE)
    doc.rect(IX, Y + 1.5, 55, 0.8, 'F')
    Y += 6.5

    // Encabezado tabla
    const TH = 6
    doc.setFillColor(...NAVY)
    doc.rect(IX, Y, CW, TH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...WHITE)
    doc.text('ASESOR / SESIÓN', IX + 3, Y + 4.2)
    doc.text('SCORE', IX + CW * 0.45, Y + 4.2, { align: 'center' })
    doc.text('CHATS', IX + CW * 0.60, Y + 4.2, { align: 'center' })
    doc.text('VENTAS', IX + CW * 0.75, Y + 4.2, { align: 'center' })
    doc.text('ESTADO / DIAGNÓSTICO', IX + CW * 0.88, Y + 4.2, { align: 'center' })
    Y += TH

    advisors.forEach((adv, aIdx) => {
      need(7.5)
      const parsed = parseBotSessionName(adv.botSessionName || adv.advisorName || '')
      const aName = parsed.fullName || adv.advisorName || 'Asesor'
      const aScore = Number(adv.score || 0)
      const sc = scoreColor(aScore)

      if (aIdx % 2 === 0) {
        doc.setFillColor(...G5)
        doc.rect(IX, Y, CW, 7, 'F')
      } else {
        doc.setFillColor(...WHITE)
        doc.rect(IX, Y, CW, 7, 'F')
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...G1)
      doc.text(aName, IX + 3, Y + 4.5)

      // Score
      doc.setFillColor(...scoreBg(aScore))
      doc.roundedRect(IX + CW * 0.45 - 6, Y + 1.5, 12, 4.5, 1, 1, 'F')
      doc.setTextColor(...sc)
      doc.text(`${aScore.toFixed(1)}`, IX + CW * 0.45, Y + 4.6, { align: 'center' })

      // Chats
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...G2)
      doc.text(String(adv.chatsAnalyzed || 0), IX + CW * 0.60, Y + 4.5, { align: 'center' })

      // Ventas
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...GREEN)
      doc.text(String(adv.salesCount || 0), IX + CW * 0.75, Y + 4.5, { align: 'center' })

      // Estado
      const statusText = aScore >= 8 ? 'Excelente' : aScore >= 6 ? 'En Observación' : 'Riesgo Crítico'
      doc.setTextColor(...sc)
      doc.text(statusText, IX + CW * 0.88, Y + 4.5, { align: 'center' })

      Y += 7
    })
  }

  /* ══════════════════════════════════════════════════════
     SECCIÓN 2 – DETALLE POR ASESOR Y AUDITORÍAS
  ══════════════════════════════════════════════════════ */

  advisors.forEach((advisor, advIndex) => {
    newPage()
    const parsed = parseBotSessionName(advisor.botSessionName || advisor.advisorName || '')
    const aName = parsed.fullName || advisor.advisorName || `Asesor #${advIndex + 1}`
    const aScore = Number(advisor.score || 0)
    const sc = scoreColor(aScore)
    const scB = scoreBg(aScore)

    // Barra de cabecera de asesor
    doc.setFillColor(...NAVY)
    doc.roundedRect(IX, Y, CW, 18, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...WHITE)
    doc.text(aName.toUpperCase(), IX + 5, Y + 7.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(190, 210, 245)
    doc.text(`Sesión WAHA: ${advisor.botSessionName || 'N/A'}  ·  ${advisor.chatsAnalyzed || 0} chats evaluados  ·  ${advisor.salesCount || 0} ventas`, IX + 5, Y + 13.5)

    // Score Badge
    const SCORE_W = 26
    const scoreX = IX + CW - SCORE_W - 4
    doc.setFillColor(...scB)
    doc.setDrawColor(...sc)
    doc.setLineWidth(0.4)
    doc.roundedRect(scoreX, Y + 3.5, SCORE_W, 11, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...sc)
    doc.text(`${aScore.toFixed(1)} / 10`, scoreX + SCORE_W / 2, Y + 10.5, { align: 'center' })

    Y += 25

    // Fortalezas y Oportunidades de Mejora en 2 columnas
    const colW = (CW - 6) / 2
    const strengths = advisor.keyStrengths || []
    const issues = advisor.criticalIssues || []

    const maxItems = Math.max(strengths.length, issues.length, 1)
    const blockH = Math.max(22, maxItems * 6 + 14)
    need(blockH + 6)

    // Caja Fortalezas (Verde)
    doc.setFillColor(244, 252, 247)
    doc.setDrawColor(180, 230, 200)
    doc.roundedRect(IX, Y, colW, blockH, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...GREEN)
    doc.text('✓ FORTALEZAS CLAVE', IX + 4, Y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(...G1)
    let sY = Y + 11
    strengths.forEach(st => {
      const lines = doc.splitTextToSize(`• ${st}`, colW - 8)
      lines.forEach(l => { doc.text(l, IX + 4, sY); sY += 3.8 })
    })

    // Caja Oportunidades / Errores (Rojo)
    const rx = IX + colW + 6
    doc.setFillColor(254, 245, 245)
    doc.setDrawColor(245, 195, 195)
    doc.roundedRect(rx, Y, colW, blockH, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...RED)
    doc.text('! PUNTOS CRÍTICOS / MEJORAS', rx + 4, Y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(...G1)
    let rY = Y + 11
    issues.forEach(is => {
      const lines = doc.splitTextToSize(`• ${is}`, colW - 8)
      lines.forEach(l => { doc.text(l, rx + 4, rY); rY += 3.8 })
    })

    Y += blockH + 8

    // Auditorías individuales de chats del asesor
    const audits = advisor.audits || []
    if (audits.length > 0) {
      need(15)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...G1)
      doc.text(`EVIDENCIAS Y CASOS EVALUADOS (${audits.length} CONVERSACIONES)`, IX, Y)
      doc.setFillColor(...BLUE)
      doc.rect(IX, Y + 1.5, 75, 0.8, 'F')
      Y += 7

      audits.forEach((audit, cIdx) => {
        const client = audit.client || 'Cliente sin nombre'
        const chatScore = Number(audit.score || 0)
        const cSc = scoreColor(chatScore)
        const rawAnalysis = audit.analysis || ''
        const quote = audit.chatQuote || audit.quote || ''

        const analLines = doc.splitTextToSize(rawAnalysis, CW - 12)
        const quoteLines = quote ? doc.splitTextToSize(`Fragmento: "${quote}"`, CW - 16) : []
        const cardH = 22 + analLines.length * 3.6 + (quote ? quoteLines.length * 3.4 + 6 : 0)

        need(cardH + 6)

        doc.setFillColor(...WHITE)
        doc.setDrawColor(215, 222, 235)
        doc.setLineWidth(0.3)
        doc.roundedRect(IX, Y, CW, cardH, 2, 2, 'FD')

        // Banda lateral de score
        doc.setFillColor(...cSc)
        doc.roundedRect(IX, Y, 3, cardH, 1, 1, 'F')

        // Encabezado del caso
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(...G1)
        doc.text(`CASO #${cIdx + 1}: ${client}`, IX + 6, Y + 6)

        // Tags
        let tagX = IX + 80
        if (audit.type) {
          doc.setFillColor(...G5)
          doc.roundedRect(tagX, Y + 2, 22, 4.5, 1, 1, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(5.5)
          doc.setTextColor(...BLUE)
          doc.text(String(audit.type).toUpperCase(), tagX + 11, Y + 5.2, { align: 'center' })
          tagX += 25
        }

        if (audit.sale_closed) {
          doc.setFillColor(230, 248, 240)
          doc.roundedRect(tagX, Y + 2, 16, 4.5, 1, 1, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(5.5)
          doc.setTextColor(...GREEN)
          doc.text('Venta ✓', tagX + 8, Y + 5.2, { align: 'center' })
        }

        // Score derecha
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(...cSc)
        doc.text(`Score: ${chatScore}/10`, IX + CW - 4, Y + 6, { align: 'right' })

        hLine(IX + 6, IX + CW - 4, Y + 8.5, G5, 0.2)

        // Análisis
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.8)
        doc.setTextColor(...G2)
        let aY = Y + 12.5
        analLines.forEach(al => {
          doc.text(al, IX + 6, aY)
          aY += 3.6
        })

        // Fragmento de chat citado
        if (quote) {
          aY += 1.5
          doc.setFillColor(245, 247, 252)
          doc.roundedRect(IX + 6, aY - 2.5, CW - 12, quoteLines.length * 3.4 + 4, 1, 1, 'F')
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(6.2)
          doc.setTextColor(...BLUE)
          quoteLines.forEach(ql => {
            doc.text(ql, IX + 9, aY)
            aY += 3.4
          })
        }

        Y += cardH + 4
      })
    }
  })

  /* ══════════════════════════════════════════════════════
     PÁGINA FINAL – RECOMENDACIONES ESTRATÉGICAS
  ══════════════════════════════════════════════════════ */
  if (recommendations && recommendations.length > 0) {
    newPage()

    doc.setFillColor(...NAVY)
    doc.roundedRect(IX, Y, CW, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...WHITE)
    doc.text('PLAN DE ACCIÓN Y RECOMENDACIONES ESTRATÉGICAS', IX + 5, Y + 9)
    Y += 20

    recommendations.forEach((rec, rIdx) => {
      const recText = typeof rec === 'string' ? rec : rec.text || rec.description || ''
      const recLines = doc.splitTextToSize(recText, CW - 24)
      const rH = Math.max(14, recLines.length * 4 + 8)

      need(rH + 4)

      doc.setFillColor(...G5)
      doc.setDrawColor(...G4)
      doc.setLineWidth(0.25)
      doc.roundedRect(IX, Y, CW, rH, 2, 2, 'FD')

      // Círculo con número
      doc.setFillColor(...BLUE)
      doc.circle(IX + 8, Y + rH / 2, 4.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...WHITE)
      doc.text(String(rIdx + 1), IX + 8, Y + rH / 2 + 2.5, { align: 'center' })

      // Texto de recomendación
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...G1)
      let textY = Y + 6.5
      recLines.forEach(rl => {
        doc.text(rl, IX + 16, textY)
        textY += 4
      })

      Y += rH + 4
    })
  }

  drawPageFooter()
  const cleanTitle = title.slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`reporte_personalizado_${cleanTitle}_${new Date().toISOString().split('T')[0]}.pdf`)
}
