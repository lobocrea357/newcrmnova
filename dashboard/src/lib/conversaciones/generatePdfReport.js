// dashboard/src/lib/conversaciones/generatePdfReport.js
import { jsPDF } from 'jspdf'
import { parseBotSessionName } from '@/lib/botNameParser'

/**
 * Genera un reporte PDF de auditoría comercial para un asesor.
 * @param {Object} payload — Datos del reporte (aiNarrative, audits, etc.)
 * @param {string} advisorSessionName — session_name del bot/asesor
 */
export function generatePdfReport(payload, advisorSessionName) {
  // Validación temprana de payload
  if (!payload || typeof payload !== 'object') {
    console.error('generatePdfReport: payload inválido', payload);
    return;
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const ML = 0, MR = 0
  const IX = 16
  const CW = PW - IX * 2
  let Y = 0

  /* ── PALETA EJECUTIVA ── */
  const NAVY   = [15,  31,  72]
  const BLUE   = [30,  80, 180]
  const GOLD   = [180,140,  30]
  const GREEN  = [22, 163, 104]
  const ORANGE = [234,130,  20]
  const RED    = [210,  40,  40]
  const G1     = [20,  20,  20]
  const G2     = [60,  60,  60]
  const G3     = [110, 110, 110]
  const G4     = [180, 180, 180]
  const G5     = [238, 240, 244]
  const WHITE  = [255, 255, 255]

  const scoreColor = s => s >= 8 ? GREEN : s >= 6 ? ORANGE : RED
  const scoreBg    = s => s >= 8 ? [230,248,240] : s >= 6 ? [255,243,215] : [254,226,226]

  /* ── HELPERS ── */
  let pageNum = 1

  const drawPageFooter = () => {
    doc.setFillColor(...G5)
    doc.rect(0, PH - 9, PW, 9, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...G3)
    doc.text('CONFIDENCIAL · USO INTERNO · VIAJES NOVA', IX, PH - 3.5)
    doc.setFont('helvetica', 'bold')
    doc.text(`Página ${pageNum}`, PW - IX, PH - 3.5, { align: 'right' })
  }

  const newPage = () => {
    drawPageFooter()
    doc.addPage()
    pageNum++
    Y = 14
  }

  const need = space => { if (Y + space > PH - 14) newPage() }
  const hLine = (x1, x2, y, color = G4, lw = 0.2) => {
    doc.setDrawColor(...color); doc.setLineWidth(lw)
    doc.line(x1, y, x2, y)
  }

  /* ── DATOS ── */
  const narrative = payload.aiNarrative || {}
  const audits    = narrative.audits || []
  const N         = audits.length

  // Usar parseBotSessionName de botNameParser.js (fuente de verdad)
  const parsed = parseBotSessionName(advisorSessionName)
  const displayName = parsed.fullName || parsed.displayName || 'Asesor'

  if (N === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.setTextColor(...G2)
    doc.text('No se encontraron auditorías para las últimas 24 horas.', IX, 40)
    drawPageFooter()
    doc.save(`reporte_${advisorSessionName || 'asesor'}.pdf`)
    return
  }

  const KPI = {
    contact_time:        'Tiempo de contacto',
    response_time:       'Tiempo de respuesta',
    product_knowledge:   'Conocimiento del producto',
    customer_filtering:  'Filtrado del cliente',
    quote_quality:       'Cotización (tiempo + calidad)',
    options_presented:   'Opciones presentadas (+2)',
    financing_offered:   'Financiamiento / métodos pago',
    negotiation_closing: 'Negociación y cierre',
    objection_handling:  'Manejo de objeciones',
    follow_up:           'Seguimiento + asesoría',
  }
  const KEYS = Object.keys(KPI)

  let totalScore = 0, salesCount = 0
  const agg = {};  KEYS.forEach(k => agg[k] = 0)
  audits.forEach(a => {
    totalScore += a.score || 0
    if (a.sale_closed) salesCount++
    KEYS.forEach(k => { if ((a.kpis || {})[k]) agg[k]++ })
  })
  const avg = parseFloat((totalScore / N).toFixed(1))

  /* ══════════════════════════════════════════════════════
     PÁGINA 1 – PORTADA EJECUTIVA
  ══════════════════════════════════════════════════════ */

  /* --- Banda superior NAVY --- */
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PW, 36, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...WHITE)
  doc.text('VIAJES NOVA', IX, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(180, 200, 240)
  doc.text('Agencia de Viajes', IX, 17)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...WHITE)
  doc.text('REPORTE DE AUDITORÍA COMERCIAL', PW - IX, 13, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(180, 200, 240)
  doc.text(`Período: Últimas 24 horas  ·  ${new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' })}`, PW - IX, 19, { align: 'right' })

  doc.setFillColor(...GOLD)
  doc.rect(0, 36, PW, 1.5, 'F')

  /* --- Bloque asesor --- */
  Y = 46
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...G3)
  doc.text('ASESOR EVALUADO', IX, Y)
  Y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...G1)
  doc.text(displayName, IX, Y)
  Y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...G1)
  doc.text(`${N} conversaciones auditadas  ·  Generado el ${new Date().toLocaleDateString('es-ES')}`, IX, Y)
  Y += 10
  hLine(IX, PW - IX, Y, G4, 0.4)
  Y += 9

  /* --- 4 KPIs de resumen --- */
  const BW = (CW - 9) / 4
  const KPI_BOXES = [
    { label: 'PROM. 24H',    value: String(avg),         sub: '/ 10 puntos',      color: scoreColor(avg), bg: scoreBg(avg) },
    { label: 'EVALUADAS',    value: String(N),            sub: 'conversaciones',   color: BLUE,            bg: [234,242,255] },
    { label: 'VENTAS',       value: String(salesCount),   sub: `de ${N} chats`,    color: GREEN,           bg: [230,248,240] },
    { label: 'SIN VENTA',    value: String(N-salesCount), sub: `de ${N} chats`,    color: RED,             bg: [254,226,226] },
  ]
  KPI_BOXES.forEach((b, i) => {
    const bx = IX + i * (BW + 3)
    doc.setFillColor(...b.bg)
    doc.setDrawColor(...G4)
    doc.roundedRect(bx, Y, BW, 24, 2, 2, 'FD')
    doc.setFillColor(...b.color)
    doc.roundedRect(bx, Y, BW, 2.5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...b.color)
    doc.text(b.label, bx + BW/2, Y + 7, { align:'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...b.color)
    doc.text(b.value, bx + BW/2, Y + 16, { align:'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(...G3)
    doc.text(b.sub, bx + BW/2, Y + 21, { align:'center' })
  })
  Y += 33

  /* --- Tabla cumplimiento por criterio --- */
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...G1)
  doc.text('CUMPLIMIENTO POR CRITERIO', IX, Y)
  doc.setFillColor(...BLUE)
  doc.rect(IX, Y + 1.5, 55, 0.8, 'F')
  Y += 7

  const R = 7
  KEYS.forEach((key, idx) => {
    const v = agg[key] || 0
    const pct = N > 0 ? Math.round(v / N * 100) : 0
    if (idx % 2 === 0) { doc.setFillColor(...G5); doc.rect(IX, Y, CW, R, 'F') }
    else                { doc.setFillColor(...WHITE); doc.rect(IX, Y, CW, R, 'F') }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...G2)
    doc.text(KPI[key], IX + 3, Y + R * 0.67)
    const barX = IX + CW * 0.55
    const barW = CW * 0.26
    doc.setFillColor(220, 225, 235)
    doc.roundedRect(barX, Y + R*0.25, barW, R*0.5, 1, 1, 'F')
    const fill = pct >= 80 ? GREEN : pct >= 50 ? ORANGE : RED
    doc.setFillColor(...fill)
    doc.roundedRect(barX, Y + R*0.25, Math.max(barW * pct / 100, 1), R*0.5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...fill)
    doc.text(`${v}/${N} (${pct}%)`, IX + CW - 2, Y + R * 0.67, { align:'right' })
    Y += R
  })

  hLine(IX, IX + CW, Y, G4, 0.3)
  Y += 8

  /* ══════════════════════════════════════════════════════
     TARJETAS INDIVIDUALES
  ══════════════════════════════════════════════════════ */
  audits.forEach((audit, auditIdx) => {
    const kpis  = audit.kpis || {}
    const score = audit.score || 0
    const sc    = scoreColor(score)
    const scBg  = scoreBg(score)

    const rawClient = audit.client || 'Sin nombre'
    const slashIdx  = rawClient.indexOf('/')
    const clientName  = slashIdx !== -1 ? rawClient.slice(0, slashIdx).trim() : rawClient
    const clientPhone = slashIdx !== -1 ? rawClient.slice(slashIdx + 1).trim() : ''

    const rawAnal = (audit.analysis || '')
      .replace(/ \| /g, ' ')
      .replace(/Errores:/gi,       '\nErrores:')
      .replace(/Aciertos:/gi,      '\nAciertos:')
      .replace(/Recomendación:/gi, '\nRecomendación:')
    const analLines = doc.splitTextToSize(rawAnal, CW - 8)

    const KPI_H  = 6.8
    const cardH  = 34 + KEYS.length * KPI_H + analLines.length * 3.9 + 10
    need(cardH + 8)

    doc.setFillColor(215, 220, 230)
    doc.roundedRect(IX + 0.8, Y + 0.8, CW, cardH, 3, 3, 'F')
    doc.setFillColor(...WHITE)
    doc.setDrawColor(210, 218, 232)
    doc.setLineWidth(0.3)
    doc.roundedRect(IX, Y, CW, cardH, 3, 3, 'FD')

    doc.setFillColor(...sc)
    doc.rect(IX, Y + 3, 3, cardH - 6, 'F')

    let cy = Y + 7

    if (auditIdx === 0) {
      need(16)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...G1)
      doc.text(`DETALLE DE EVALUACIONES (${N} CONVERSACIONES)`, IX, Y)
      doc.setFillColor(...BLUE)
      doc.rect(IX, Y + 1.5, 75, 0.8, 'F')
      Y += 8
      cy = Y + 7
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...G1)
    doc.text(`EVALUACIÓN #${auditIdx + 1}  ·  ${new Date().toLocaleDateString('es-ES')}  ·  ${displayName}`, IX + 6, cy)

    const BADGE_W = 24
    const scoreX = IX + CW - BADGE_W - 2
    doc.setFillColor(...scBg)
    doc.setDrawColor(...sc)
    doc.setLineWidth(0.5)
    doc.roundedRect(scoreX, cy - 5, BADGE_W, 10, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...sc)
    doc.text(String(score), scoreX + 6, cy + 2.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...sc)
    doc.text('/10', scoreX + 14, cy + 2.5)

    cy += 7

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...G1)
    doc.text(clientName, IX + 6, cy)

    if (audit.type) {
      const typeLabel = (audit.type || '').toUpperCase()
      const tw = doc.getTextWidth(typeLabel) + 4
      const nameW = doc.getTextWidth(clientName)
      doc.setFillColor(...G5)
      doc.setDrawColor(...G4)
      doc.roundedRect(IX + 8 + nameW, cy - 4, tw, 5, 1.5, 1.5, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5.5)
      doc.setTextColor(...BLUE)
      doc.text(typeLabel, IX + 10 + nameW, cy - 0.5)
    }
    cy += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...G3)
    if (clientPhone) doc.text(clientPhone, IX + 6, cy)
    cy += 4

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    let tagX = IX + 6
    doc.setFillColor(230, 248, 240); doc.setDrawColor(...GREEN); doc.roundedRect(tagX - 1, cy - 4, 20, 5.5, 1.5, 1.5, 'FD')
    doc.setTextColor(...GREEN); doc.text('Respondió', tagX + 1, cy)
    tagX += 23
    if (audit.sale_closed) {
      doc.setFillColor(219, 234, 254); doc.setDrawColor(...BLUE); doc.roundedRect(tagX - 1, cy - 4, 16, 5.5, 1.5, 1.5, 'FD')
      doc.setTextColor(...BLUE); doc.text('Venta ✓', tagX + 1, cy)
    }
    cy += 8

    hLine(IX + 4, IX + CW - 4, cy, G4, 0.2)
    cy += 1

    KEYS.forEach((key, ki) => {
      const passed = kpis[key] === true
      cy += KPI_H
      if (ki % 2 === 0) { doc.setFillColor(250, 251, 253); doc.rect(IX + 4, cy - KPI_H + 1, CW - 8, KPI_H, 'F') }
      if (passed) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...GREEN)
        doc.text('✓', IX + 7, cy - 1)
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 205, 215)
        doc.text('✗', IX + 7, cy - 1)
      }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...G2)
      doc.text(KPI[key], IX + 13, cy - 1)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
      if (passed) { doc.setTextColor(...GREEN); doc.text('1', IX + CW - 7, cy - 1, { align:'right' }) }
      else        { doc.setTextColor(...RED);   doc.text('0', IX + CW - 7, cy - 1, { align:'right' }) }
      hLine(IX + 4, IX + CW - 4, cy + 1.5, G5, 0.15)
    })
    cy += 6

    hLine(IX + 4, IX + CW - 4, cy, G4, 0.25)
    cy += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    analLines.forEach(line => {
      if      (line.startsWith('Errores:'))        doc.setTextColor(...RED)
      else if (line.startsWith('Aciertos:'))       doc.setTextColor(...GREEN)
      else if (line.startsWith('Recomendación:'))  doc.setTextColor(...BLUE)
      else                                         doc.setTextColor(...G2)
      doc.text(line, IX + 6, cy)
      cy += 4
    })

    Y = cy + 10
  })

  drawPageFooter()
  doc.save(`reporte_${advisorSessionName || 'asesor'}.pdf`)
}
