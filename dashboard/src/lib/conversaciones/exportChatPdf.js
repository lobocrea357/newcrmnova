// dashboard/src/lib/conversaciones/exportChatPdf.js
import { jsPDF } from 'jspdf'
import { parseBotSessionName } from '@/lib/botNameParser'

/**
 * Paleta de colores ejecutiva institucional (Viajes Nova)
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
const G5     = [242, 245, 250]
const WHITE  = [255, 255, 255]

/**
 * Formatea una fecha ISO a formato legible en español
 */
function formatDate(timestamp) {
  if (!timestamp) return 'N/A'
  try {
    const d = new Date(timestamp)
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return String(timestamp)
  }
}

/**
 * Limpia y normaliza el texto de un mensaje
 */
function cleanMessageText(text) {
  if (!text) return '[Sin texto]'
  return String(text)
    .replace(/\r\n|\r/g, '\n')
    .replace(/&b/gi, '• ')
    .trim()
}

/**
 * Exporta una conversación individual a PDF profesional
 * @param {Object} chat - Datos de la conversación (contact_name, contact_phone, etc.)
 * @param {Array} messages - Lista de mensajes de la conversación
 * @param {string} advisorSessionName - Nombre de sesión del bot/asesor
 */
export function exportSingleChatPdf(chat, messages = [], advisorSessionName = '') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const IX = 16
  const CW = PW - IX * 2
  let Y = 0
  let pageNum = 1

  const parsed = parseBotSessionName(advisorSessionName || chat?.bot?.session_name || '')
  const advisorName = parsed.fullName || parsed.displayName || advisorSessionName || 'Asesor'
  const contactName = chat?.contact_name || chat?.name || chat?.contact_phone || 'Cliente'
  const contactPhone = chat?.contact_phone || chat?.contact_number || chat?.chat_id || 'N/A'

  const drawPageFooter = () => {
    doc.setFillColor(...G5)
    doc.rect(0, PH - 9, PW, 9, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...G3)
    doc.text('CONFIDENCIAL · TRANSCRIPCIÓN OFICIAL · VIAJES NOVA', IX, PH - 3.5)
    doc.setFont('helvetica', 'bold')
    doc.text(`Página ${pageNum}`, PW - IX, PH - 3.5, { align: 'right' })
  }

  const newPage = () => {
    drawPageFooter()
    doc.addPage()
    pageNum++
    Y = 16
  }

  const need = (space) => {
    if (Y + space > PH - 14) {
      newPage()
    }
  }

  /* ── PORTADA / HEADER SUPERIOR ── */
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PW, 32, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...WHITE)
  doc.text('VIAJES NOVA', IX, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(180, 200, 240)
  doc.text('Registro Oficial de Conversación', IX, 16)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...WHITE)
  doc.text('TRANSCRIPCIÓN DE CHAT WHATSAPP', PW - IX, 11, { align: 'right' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(180, 200, 240)
  doc.text(`Descargado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, PW - IX, 17, { align: 'right' })

  doc.setFillColor(...GOLD)
  doc.rect(0, 32, PW, 1.5, 'F')

  /* ── METADATOS DEL CHAT ── */
  Y = 40
  doc.setFillColor(...G5)
  doc.setDrawColor(...G4)
  doc.roundedRect(IX, Y, CW, 24, 2, 2, 'FD')

  // Columna 1: Cliente
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...G3)
  doc.text('CLIENTE / CONTACTO:', IX + 4, Y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...G1)
  doc.text(contactName, IX + 4, Y + 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...G2)
  doc.text(`Tel: ${contactPhone}`, IX + 4, Y + 18)

  // Columna 2: Asesor
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...G3)
  doc.text('ASESOR RESPONSABLE:', IX + CW * 0.42, Y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...G1)
  doc.text(advisorName, IX + CW * 0.42, Y + 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...G2)
  doc.text(`Sesión: ${advisorSessionName || 'N/A'}`, IX + CW * 0.42, Y + 18)

  // Columna 3: Totales
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...G3)
  doc.text('TOTAL MENSAJES:', IX + CW * 0.78, Y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...BLUE)
  doc.text(String(messages.length), IX + CW * 0.78, Y + 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...G3)
  doc.text(messages.length > 0 ? `Inicio: ${formatDate(messages[0]?.timestamp)}` : 'Sin mensajes', IX + CW * 0.78, Y + 18)

  Y += 30

  /* ── MENSAJES ── */
  if (!messages || messages.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...G3)
    doc.text('No hay mensajes registrados en esta conversación.', IX, Y)
  } else {
    messages.forEach((msg) => {
      const isFromMe = !!msg.from_me
      const senderLabel = isFromMe ? `Asesor (${advisorName})` : `Cliente (${contactName})`
      const timeStr = formatDate(msg.timestamp)
      const rawText = cleanMessageText(msg.body || msg.content || (msg.has_media ? '[Archivo multimedia / Audio]' : ''))
      
      const maxBubbleW = CW * 0.82
      const textLines = doc.splitTextToSize(rawText, maxBubbleW - 8)
      const bubbleH = Math.max(13, textLines.length * 3.8 + 9)

      need(bubbleH + 4)

      const bubbleX = isFromMe ? IX + CW - maxBubbleW : IX
      const bubbleBg = isFromMe ? [235, 242, 255] : [245, 246, 248]
      const borderColor = isFromMe ? [190, 210, 245] : [220, 225, 232]
      const headerColor = isFromMe ? BLUE : G2

      // Fondo de la burbuja
      doc.setFillColor(...bubbleBg)
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.25)
      doc.roundedRect(bubbleX, Y, maxBubbleW, bubbleH, 2, 2, 'FD')

      // Encabezado del mensaje (remitente + hora)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...headerColor)
      doc.text(senderLabel, bubbleX + 4, Y + 4.5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.8)
      doc.setTextColor(...G3)
      doc.text(timeStr, bubbleX + maxBubbleW - 4, Y + 4.5, { align: 'right' })

      // Texto del mensaje
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.2)
      doc.setTextColor(...G1)
      let textY = Y + 8.5
      textLines.forEach((line) => {
        doc.text(line, bubbleX + 4, textY)
        textY += 3.8
      })

      Y += bubbleH + 3
    })
  }

  drawPageFooter()
  const cleanAdvisor = (advisorSessionName || 'asesor').replace(/[^a-zA-Z0-9_-]/g, '_')
  const cleanContact = (contactName || 'cliente').replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`chat_${cleanAdvisor}_${cleanContact}_${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Exporta una conversación individual a formato de texto plano (.txt)
 */
export function exportSingleChatTxt(chat, messages = [], advisorSessionName = '') {
  const parsed = parseBotSessionName(advisorSessionName || chat?.bot?.session_name || '')
  const advisorName = parsed.fullName || parsed.displayName || advisorSessionName || 'Asesor'
  const contactName = chat?.contact_name || chat?.name || chat?.contact_phone || 'Cliente'
  const contactPhone = chat?.contact_phone || chat?.contact_number || chat?.chat_id || 'N/A'

  let txt = `=================================================================\n`
  txt += `VIAJES NOVA - REGISTRO DE CONVERSACIÓN DE WHATSAPP\n`
  txt += `=================================================================\n`
  txt += `Cliente: ${contactName} (${contactPhone})\n`
  txt += `Asesor:  ${advisorName} (${advisorSessionName})\n`
  txt += `Total mensajes: ${messages.length}\n`
  txt += `Fecha de exportación: ${new Date().toLocaleString('es-ES')}\n`
  txt += `=================================================================\n\n`

  messages.forEach((msg) => {
    const sender = msg.from_me ? `[ASESOR: ${advisorName}]` : `[CLIENTE: ${contactName}]`
    const time = formatDate(msg.timestamp)
    const body = cleanMessageText(msg.body || msg.content || (msg.has_media ? '[Archivo multimedia / Audio]' : ''))
    txt += `${time} - ${sender}:\n${body}\n\n`
  })

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cleanAdvisor = (advisorSessionName || 'asesor').replace(/[^a-zA-Z0-9_-]/g, '_')
  const cleanContact = (contactName || 'cliente').replace(/[^a-zA-Z0-9_-]/g, '_')
  a.href = url
  a.download = `chat_${cleanAdvisor}_${cleanContact}_${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exporta todas las conversaciones de un asesor a un PDF consolidado
 * @param {Object} bot - Datos del bot (session_name, etc.)
 * @param {Array} chatsWithMessages - Array de { chat, messages }
 */
export function exportAdvisorChatsPdf(bot, chatsWithMessages = []) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const IX = 16
  const CW = PW - IX * 2
  let Y = 0
  let pageNum = 1

  const parsed = parseBotSessionName(bot?.session_name || '')
  const advisorName = parsed.fullName || parsed.displayName || bot?.session_name || 'Asesor'

  const drawPageFooter = () => {
    doc.setFillColor(...G5)
    doc.rect(0, PH - 9, PW, 9, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...G3)
    doc.text(`CONFIDENCIAL · HISTORIAL DE CHATS · ${advisorName.toUpperCase()} · VIAJES NOVA`, IX, PH - 3.5)
    doc.setFont('helvetica', 'bold')
    doc.text(`Página ${pageNum}`, PW - IX, PH - 3.5, { align: 'right' })
  }

  const newPage = () => {
    drawPageFooter()
    doc.addPage()
    pageNum++
    Y = 16
  }

  const need = (space) => {
    if (Y + space > PH - 14) {
      newPage()
    }
  }

  /* ── PORTADA DEL COMPILADO ── */
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PW, 40, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...WHITE)
  doc.text('VIAJES NOVA', IX, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(180, 200, 240)
  doc.text('Compilación Completa de Conversaciones de WhatsApp', IX, 19)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...WHITE)
  doc.text('HISTORIAL DE CONVERSACIONES', PW - IX, 13, { align: 'right' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(180, 200, 240)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, PW - IX, 19, { align: 'right' })

  doc.setFillColor(...GOLD)
  doc.rect(0, 40, PW, 1.8, 'F')

  // Datos del asesor y resumen
  Y = 50
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...G3)
  doc.text('ASESOR EVALUADO:', IX, Y)
  Y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...G1)
  doc.text(advisorName, IX, Y)
  Y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...G2)
  doc.text(`Sesión: ${bot?.session_name || 'N/A'}  ·  Tel: ${bot?.phone_number || 'N/A'}`, IX, Y)
  Y += 10

  const totalChats = chatsWithMessages.length
  const totalMsgs = chatsWithMessages.reduce((sum, item) => sum + (item.messages?.length || 0), 0)

  // Cajas estadísticas
  const BOX_W = (CW - 6) / 3
  const STATS = [
    { label: 'CONVERSACIONES', val: String(totalChats), sub: 'chats compilados', color: BLUE, bg: [234, 242, 255] },
    { label: 'TOTAL MENSAJES', val: String(totalMsgs), sub: 'mensajes intercambiados', color: GREEN, bg: [230, 248, 240] },
    { label: 'FECHA EMISIÓN', val: new Date().toLocaleDateString('es-ES'), sub: 'registro histórico', color: NAVY, bg: G5 },
  ]

  STATS.forEach((st, i) => {
    const bx = IX + i * (BOX_W + 3)
    doc.setFillColor(...st.bg)
    doc.setDrawColor(...G4)
    doc.roundedRect(bx, Y, BOX_W, 20, 2, 2, 'FD')
    doc.setFillColor(...st.color)
    doc.roundedRect(bx, Y, BOX_W, 2, 1, 1, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...st.color)
    doc.text(st.label, bx + BOX_W / 2, Y + 6.5, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...st.color)
    doc.text(st.val, bx + BOX_W / 2, Y + 13, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(...G3)
    doc.text(st.sub, bx + BOX_W / 2, Y + 17.5, { align: 'center' })
  })

  Y += 28

  /* ── ÍNDICE / LISTA DE CHATS ── */
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...G1)
  doc.text('ÍNDICE DE CONVERSACIONES INCLUIDAS', IX, Y)
  doc.setFillColor(...BLUE)
  doc.rect(IX, Y + 1.5, 65, 0.8, 'F')
  Y += 7

  chatsWithMessages.forEach((item, index) => {
    need(8)
    const c = item.chat || {}
    const cName = c.contact_name || c.name || c.contact_phone || 'Cliente sin nombre'
    const cPhone = c.contact_phone || c.contact_number || ''
    const msgCount = item.messages?.length || 0

    if (index % 2 === 0) {
      doc.setFillColor(...G5)
      doc.rect(IX, Y - 3.5, CW, 7, 'F')
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...G1)
    doc.text(`${index + 1}. ${cName}`, IX + 3, Y + 1)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...G3)
    if (cPhone) doc.text(cPhone, IX + 70, Y + 1)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BLUE)
    doc.text(`${msgCount} msgs`, IX + CW - 4, Y + 1, { align: 'right' })

    Y += 7
  })

  /* ── DESGLOSE DE CADA CONVERSACIÓN ── */
  chatsWithMessages.forEach((item, chatIdx) => {
    const c = item.chat || {}
    const msgs = item.messages || []
    const cName = c.contact_name || c.name || c.contact_phone || 'Cliente'
    const cPhone = c.contact_phone || c.contact_number || c.chat_id || ''

    newPage()

    // Encabezado de la conversación
    doc.setFillColor(...NAVY)
    doc.roundedRect(IX, Y, CW, 14, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...WHITE)
    doc.text(`CONVERSACIÓN #${chatIdx + 1}: ${cName.toUpperCase()}`, IX + 4, Y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(190, 210, 245)
    doc.text(`Tel: ${cPhone || 'N/A'}  ·  ${msgs.length} mensajes  ·  Asesor: ${advisorName}`, IX + 4, Y + 11)

    Y += 18

    if (msgs.length === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...G3)
      doc.text('No hay mensajes registrados en este chat.', IX, Y)
      Y += 10
      return
    }

    msgs.forEach((msg) => {
      const isFromMe = !!msg.from_me
      const sender = isFromMe ? `Asesor (${advisorName})` : `Cliente (${cName})`
      const time = formatDate(msg.timestamp)
      const text = cleanMessageText(msg.body || msg.content || (msg.has_media ? '[Archivo multimedia / Audio]' : ''))

      const maxBubbleW = CW * 0.82
      const textLines = doc.splitTextToSize(text, maxBubbleW - 8)
      const bubbleH = Math.max(12, textLines.length * 3.8 + 8)

      need(bubbleH + 3)

      const bubbleX = isFromMe ? IX + CW - maxBubbleW : IX
      const bubbleBg = isFromMe ? [235, 242, 255] : [245, 246, 248]
      const borderColor = isFromMe ? [190, 210, 245] : [220, 225, 232]
      const headerColor = isFromMe ? BLUE : G2

      doc.setFillColor(...bubbleBg)
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.2)
      doc.roundedRect(bubbleX, Y, maxBubbleW, bubbleH, 1.5, 1.5, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6)
      doc.setTextColor(...headerColor)
      doc.text(sender, bubbleX + 3.5, Y + 4)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.setTextColor(...G3)
      doc.text(time, bubbleX + maxBubbleW - 3.5, Y + 4, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...G1)
      let textY = Y + 7.5
      textLines.forEach((line) => {
        doc.text(line, bubbleX + 3.5, textY)
        textY += 3.8
      })

      Y += bubbleH + 2.5
    })
  })

  drawPageFooter()
  const cleanSession = (bot?.session_name || 'asesor').replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`compilado_chats_${cleanSession}_${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Exporta todas las conversaciones de un asesor a un archivo de texto plano consolidado
 */
export function exportAdvisorChatsTxt(bot, chatsWithMessages = []) {
  const parsed = parseBotSessionName(bot?.session_name || '')
  const advisorName = parsed.fullName || parsed.displayName || bot?.session_name || 'Asesor'

  let txt = `=================================================================\n`
  txt += `VIAJES NOVA - COMPILADO DE CHATS DE WHATSAPP\n`
  txt += `=================================================================\n`
  txt += `Asesor: ${advisorName} (${bot?.session_name || 'N/A'})\n`
  txt += `Teléfono Asesor: ${bot?.phone_number || 'N/A'}\n`
  txt += `Total de conversaciones: ${chatsWithMessages.length}\n`
  txt += `Fecha de generación: ${new Date().toLocaleString('es-ES')}\n`
  txt += `=================================================================\n\n`

  chatsWithMessages.forEach((item, index) => {
    const c = item.chat || {}
    const msgs = item.messages || []
    const cName = c.contact_name || c.name || c.contact_phone || 'Cliente'
    const cPhone = c.contact_phone || c.contact_number || ''

    txt += `\n#################################################################\n`
    txt += `CONVERSACIÓN #${index + 1}: ${cName} (${cPhone})\n`
    txt += `Total de mensajes: ${msgs.length}\n`
    txt += `#################################################################\n\n`

    msgs.forEach((msg) => {
      const sender = msg.from_me ? `[ASESOR: ${advisorName}]` : `[CLIENTE: ${cName}]`
      const time = formatDate(msg.timestamp)
      const body = cleanMessageText(msg.body || msg.content || (msg.has_media ? '[Archivo multimedia / Audio]' : ''))
      txt += `${time} - ${sender}:\n${body}\n\n`
    })
  })

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cleanSession = (bot?.session_name || 'asesor').replace(/[^a-zA-Z0-9_-]/g, '_')
  a.href = url
  a.download = `compilado_chats_${cleanSession}_${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
