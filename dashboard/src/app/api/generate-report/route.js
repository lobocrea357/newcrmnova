import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
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

    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id, contact_name, contact_number, last_message_time, ai_analysis, last_message')
      .eq('bot_id', botId)
      .order('last_message_time', { ascending: false, nullsLast: true })
      .limit(120)

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

    const analysisPayload = {
      summary,
      evidence
    }

    const jsonPrompt = customPrompt || `Eres un director comercial senior y debes redactar un informe extenso (mínimo 4 párrafos en total) en español. Analiza TODOS los datos entregados y responde EXCLUSIVAMENTE con un JSON válido usando la siguiente estructura exacta. Cada campo debe contener texto corrido (sin Markdown ni viñetas automáticas) y, cuando aplique, al menos 3 oraciones usando cifras concretas y citas entre comillas:
{
  "introduction": "Párrafo introductorio que mencione cantidad de conversaciones, mensajes y contexto temporal.",
  "findings": [
    {
      "title": "Título del hallazgo",
      "description": "Redacción completa (mínimo 3 frases) con métricas y comparaciones.",
      "evidence_quotes": ["cita textual de cliente o asesor", "otra cita"],
      "impact": "Describe por qué esto favorece o afecta el negocio."
    }
  ],
  "improvements": [
    {"title": "Área a mejorar", "actions": ["Acción concreta 1", "Acción concreta 2", "Acción concreta 3"]}
  ],
  "conclusion": "Cierre estratégico con próximos pasos (mínimo 3 frases)."
}
Usa únicamente texto plano (sin *, -, ni listas automáticas). Si detectas fragmentos relevantes, inclúyelos entre comillas dentro de evidence_quotes.`

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: jsonPrompt
        },
        {
          role: 'user',
          content: JSON.stringify({
            descripcion: `Información consolidada para el bot ${botId}`,
            payload: analysisPayload
          })
        }
      ],
      temperature: 0.15,
      max_tokens: 1400
    })

    let aiNarrative = {
      introduction: '',
      findings: [],
      improvements: [],
      conclusion: ''
    }

    const aiContent = aiResponse.choices?.[0]?.message?.content || ''
    try {
      const parsed = JSON.parse(aiContent)
      aiNarrative = {
        introduction: parsed.introduction || '',
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        conclusion: parsed.conclusion || ''
      }
    } catch (error) {
      console.warn('No se pudo parsear la respuesta de IA, usando fallback.', error)
      aiNarrative = {
        introduction: `Se evaluó el bot ${botId} sobre ${summary.totalChats} conversaciones recientes y ${summary.totalMessages} mensajes para identificar oportunidades comerciales y fallos de servicio.`,
        findings: [
          {
            title: 'Baja conversión y tiempos altos',
            description: `Se registraron ${summary.salesCompleted} ventas frente a ${summary.salesFailed} oportunidades perdidas. El tiempo promedio de respuesta fue de ${summary.averageResponseMinutes ?? 'N/D'} minutos con máximos de ${summary.worstResponseMinutes ?? 'N/D'} minutos, lo que evidencia cuellos de botella en el seguimiento.`,
            evidence_quotes: [],
            impact: 'El volumen de oportunidades sin cerrar puede impactar ingresos mensuales y satisfacción del cliente.'
          }
        ],
        improvements: [
          {
            title: 'Seguimiento comercial',
            actions: [
              'Implementar recordatorios diarios para contactos sin respuesta.',
              'Definir plantillas para acelerar el primer mensaje del asesor.',
              'Medir tiempos de respuesta por asesor y publicar métricas en reuniones.'
            ]
          }
        ],
        conclusion: 'Es imprescindible fortalecer la disciplina comercial y acortar los tiempos de respuesta para capturar más oportunidades y proteger la reputación del servicio.'
      }
    }

    return NextResponse.json({
      summary,
      evidence,
      aiNarrative
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'No se pudo generar el reporte con IA.' },
      { status: 500 }
    )
  }
}
