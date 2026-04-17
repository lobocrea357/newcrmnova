import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function truncateText(text = '', limit = 160) {
  if (!text) return ''
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}

function sanitizeSnippet(text = '') {
  return text
    .replace(/\r\n|\r/g, '\n')
    .replace(/&b/gi, '• ')
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function analyzeChatMoments(messages = []) {
  if (!messages.length) {
    return {
      responseRecords: [],
      lateResponses: [],
      quickResponses: []
    }
  }

  const responseRecords = []
  const lateResponses = []
  const quickResponses = []
  let pendingClientMessage = null

  messages.forEach((message) => {
    if (!message?.timestamp) return
    if (!message.from_me) {
      pendingClientMessage = message
      return
    }

    if (pendingClientMessage) {
      const responseMinutes =
        (new Date(message.timestamp).getTime() - new Date(pendingClientMessage.timestamp).getTime()) /
        (1000 * 60)

      if (responseMinutes >= 0 && responseMinutes < 60 * 24 * 7) {
        const fragment = {
          responseMinutes: Number(responseMinutes.toFixed(1)),
          clientSnippet: truncateText(pendingClientMessage.body || '[Mensaje sin texto]'),
          advisorSnippet: truncateText(message.body || '[Mensaje sin texto]'),
          occurredAt: message.timestamp
        }

        responseRecords.push(fragment.responseMinutes)

        if (fragment.responseMinutes > 30) {
          lateResponses.push(fragment)
        } else if (fragment.responseMinutes <= 5) {
          quickResponses.push(fragment)
        }
      }

      pendingClientMessage = null
    }
  })

  return {
    responseRecords,
    lateResponses,
    quickResponses
  }
}

export async function POST(request) {
  try {
    if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
      return NextResponse.json(
        { error: 'Supabase credentials are not configured' },
        { status: 500 }
      )
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const { botId, customPrompt } = await request.json()

    if (!botId) {
      return NextResponse.json({ error: 'botId is required' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization') || ''
    const sessionToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : null

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      sessionToken
        ? {
            global: {
              headers: {
                Authorization: `Bearer ${sessionToken}`
              }
            }
          }
        : undefined
    )

    // Regla de Negocio Gerencial: Analizar estrictamente las últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id, contact_name, contact_number, last_message_time, ai_analysis, last_message')
      .eq('bot_id', botId)
      .gte('last_message_time', twentyFourHoursAgo)
      .order('last_message_time', { ascending: false, nullsLast: true })
      .limit(100)

    if (chatsError) {
      console.error('Error fetching chats for report:', chatsError)
      return NextResponse.json({ error: 'No se pudo obtener la información de las conversaciones' }, { status: 500 })
    }

    if (!chats || chats.length === 0) {
      return NextResponse.json({ error: 'No se encontraron conversaciones para este asesor.' }, { status: 404 })
    }

    const chatIds = chats.map((chat) => chat.id)

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('id, chat_id, body, from_me, timestamp')
      .in('chat_id', chatIds)
      .order('timestamp', { ascending: true })
      .limit(5000)

    if (messagesError) {
      console.error('Error fetching messages for report:', messagesError)
      return NextResponse.json({ error: 'No se pudieron obtener los mensajes para el análisis.' }, { status: 500 })
    }

    const messagesByChat = new Map()
    messagesData?.forEach((message) => {
      if (!messagesByChat.has(message.chat_id)) {
        messagesByChat.set(message.chat_id, [])
      }
      messagesByChat.get(message.chat_id).push(message)
    })

    const summary = {
      totalChats: chats.length,
      totalMessages: messagesData?.length || 0,
      salesCompleted: 0,
      salesFailed: 0,
      averageResponseMinutes: null,
      worstResponseMinutes: null
    }

    const evidence = {
      highlightedWins: [],
      lateResponses: [],
      improvementReasons: []
    }

    const allResponseTimes = []

    chats.forEach((chat) => {
      const saleCompleted = chat.ai_analysis?.sale_completed
      if (saleCompleted) {
        summary.salesCompleted += 1
      } else {
        summary.salesFailed += 1
        if (chat.ai_analysis?.failure_reason) {
          evidence.improvementReasons.push({
            contact: chat.contact_name || chat.contact_number || 'Sin nombre',
            reason: chat.ai_analysis.failure_reason
          })
        }
      }

      const chatMoments = analyzeChatMoments(messagesByChat.get(chat.id) || [])

      if (chatMoments.responseRecords.length) {
        allResponseTimes.push(...chatMoments.responseRecords)
      }

      chatMoments.quickResponses.slice(0, 2).forEach((moment) => {
        evidence.highlightedWins.push({
          contact: chat.contact_name || chat.contact_number || 'Sin nombre',
          ...moment,
          clientSnippet: sanitizeSnippet(moment.clientSnippet),
          advisorSnippet: sanitizeSnippet(moment.advisorSnippet)
        })
      })

      chatMoments.lateResponses.slice(0, 2).forEach((moment) => {
        evidence.lateResponses.push({
          contact: chat.contact_name || chat.contact_number || 'Sin nombre',
          ...moment,
          clientSnippet: sanitizeSnippet(moment.clientSnippet),
          advisorSnippet: sanitizeSnippet(moment.advisorSnippet)
        })
      })
    })

    if (allResponseTimes.length) {
      const sum = allResponseTimes.reduce((acc, value) => acc + value, 0)
      summary.averageResponseMinutes = Number((sum / allResponseTimes.length).toFixed(1))
      summary.worstResponseMinutes = Number(Math.max(...allResponseTimes).toFixed(1))
    }

    evidence.highlightedWins = evidence.highlightedWins.slice(0, 6)
    evidence.lateResponses = evidence.lateResponses.slice(0, 6)
    evidence.improvementReasons = evidence.improvementReasons.slice(0, 6)

    // Construir payload para Gemini: top 15 chats con más mensajes, 25 mensajes cada uno
    const chatsConMensajes = chats
      .map((chat) => ({
        chat,
        msgs: (messagesByChat.get(chat.id) || []).slice(-25)
      }))
      .sort((a, b) => b.msgs.length - a.msgs.length)  // priorizar chats con más actividad
      .slice(0, 15)

    const chatsForGemini = chatsConMensajes.map(({ chat, msgs }) => ({
      cliente: chat.contact_name || chat.contact_number || 'Sin nombre',
      telefono: chat.contact_number || '',
      mensajes: msgs.map(m => ({
        de: m.from_me ? 'asesor' : 'cliente',
        texto: (m.body || '').slice(0, 250),
        hora: m.timestamp
      }))
    }))

    console.log(`[QA-REPORT] Chats 24h: ${chats.length} | Enviando top ${chatsForGemini.length} a Gemini`)

    const analysisPayload = {
      totalChats: chats.length,
      chats: chatsForGemini
    }

    // SIEMPRE usar el prompt QA estándar (ignoramos customPrompt obsoleto)
    const jsonPrompt = `RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO. SIN TEXTO ANTES NI DESPUÉS. SIN MARKDOWN.

Eres el Director de Auditoría Comercial. Analiza las conversaciones de WhatsApp de este asesor de viajes y devuelve el siguiente JSON:

{
  "summary": "2 frases ejecutivas sobre el desempeño general del asesor",
  "totalAnalyzed": 7,
  "audits": [
    {
      "client": "Nombre o teléfono del cliente",
      "type": "turismo|migratorio|tour|billete",
      "score": 7,
      "sale_closed": false,
      "kpis": {
        "contact_time": true,
        "response_time": false,
        "product_knowledge": true,
        "customer_filtering": true,
        "quote_quality": false,
        "options_presented": false,
        "financing_offered": false,
        "negotiation_closing": true,
        "objection_handling": true,
        "follow_up": false
      },
      "analysis": "Párrafo ejecutivo: qué pasó, qué falló, qué hizo bien, y recomendación."
    }
  ]
}

REGLAS:
- Selecciona las 7 conversaciones MÁS RELEVANTES (ventas cerradas, objeciones, chats largos, abandonos graves)
- Evalúa cada KPI como true/false basándote en los mensajes reales
- El score es la suma de KPIs true (máximo 10)
- El analysis debe ser un párrafo de 3-5 oraciones con datos concretos del chat
- NADA DE TEXTO FUERA DEL JSON`

    // Configuración de Gemini 2.5 Pro (Nivel 3)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 8000
      }
    })

    const promptFinal = `
      ${jsonPrompt}

      INFORMACIÓN DEL ASESOR PARA AUDITAR:
      ${JSON.stringify({
        descripcion: `Información consolidada para el bot ${botId}`,
        payload: analysisPayload
      })}
    `

    const result = await model.generateContent(promptFinal)
    const aiResponse = await result.response
    let aiContent = aiResponse.text() || ''
    
    // Limpieza agresiva de Markdown para garantizar JSON.parse
    aiContent = aiContent.replace(/```json/gi, '').replace(/```/g, '').trim()

    let finalQA = {
      summary: '',
      totalAnalyzed: 0,
      audits: []
    }

    try {
      const parsed = JSON.parse(aiContent)
      console.log('[QA-REPORT] Parsed OK. Audits count:', parsed.audits?.length ?? 'undefined')
      finalQA = {
        summary: parsed.summary || parsed.introduction || '',
        totalAnalyzed: parsed.totalAnalyzed || (parsed.audits ? parsed.audits.length : 0),
        audits: Array.isArray(parsed.audits) ? parsed.audits : []
      }
    } catch (error) {
      console.error('[QA-REPORT] JSON.parse FAILED. Raw AI content (primeros 500 chars):', aiContent.slice(0, 500))
      finalQA = {
        summary: `Fallo detectado al parsear QA de IA. Revisa consola. Total chats provistos: ${summary.totalChats}`,
        totalAnalyzed: 0,
        audits: []
      }
    }

    return NextResponse.json({
      summary,
      evidence,
      aiNarrative: finalQA,
      _debug: { rawAILength: aiContent.length, rawAIPreview: aiContent.slice(0, 300) }
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'No se pudo generar el reporte con IA.' },
      { status: 500 }
    )
  }
}
