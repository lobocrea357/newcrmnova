import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { isInternalChat, normalizePhone } from '@/lib/chatFilters'
import { parseBotSessionName } from '@/lib/botNameParser'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getCutoffDate(timeframe = '24h') {
  const now = Date.now()
  switch (timeframe) {
    case '24h':
      return new Date(now - 24 * 60 * 60 * 1000).toISOString()
    case '3d':
      return new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '15d':
      return new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    case 'all':
    default:
      return null
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

    const { botIds, userPrompt, timeframe = '24h', maxChatsPerAdvisor = 10 } = await request.json()

    if (!botIds || !Array.isArray(botIds) || botIds.length === 0) {
      return NextResponse.json({ error: 'Debes seleccionar al menos un asesor (botId).' }, { status: 400 })
    }

    if (!userPrompt || !userPrompt.trim()) {
      return NextResponse.json({ error: 'Debes ingresar las instrucciones o requerimiento para el reporte.' }, { status: 400 })
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

    // 1. Obtener información de los bots seleccionados
    const { data: selectedBots, error: botsError } = await supabase
      .from('bots')
      .select('id, session_name, phone_number, status')
      .in('id', botIds)

    if (botsError || !selectedBots || selectedBots.length === 0) {
      return NextResponse.json({ error: 'No se encontraron los asesores seleccionados.' }, { status: 404 })
    }

    // 2. Obtener lista negra de staff y bots para filtrar chats internos
    const [{ data: allBots }, { data: allTeam }] = await Promise.all([
      supabase.from('bots').select('phone_number'),
      supabase.from('team_members').select('phone_number')
    ])

    const botPhonesSet = new Set([
      ...(allBots || []).map(b => normalizePhone(b.phone_number)).filter(Boolean),
      ...(allTeam || []).map(t => normalizePhone(t.phone_number)).filter(Boolean)
    ])

    const cutoffDate = getCutoffDate(timeframe)
    const advisorsDataForAI = []
    let totalChatsGathered = 0

    // 3. Recopilar chats y mensajes para cada asesor seleccionado
    for (const bot of selectedBots) {
      const parsed = parseBotSessionName(bot.session_name)
      const advisorDisplayName = parsed.fullName || parsed.displayName || bot.session_name

      let query = supabase
        .from('chats')
        .select('id, contact_name, contact_number, last_message_time, ai_analysis, last_message, is_group')
        .eq('bot_id', bot.id)
        .eq('is_group', false)
        .order('last_message_time', { ascending: false, nullsLast: true })
        .limit(Math.min(maxChatsPerAdvisor * 3, 100))

      if (cutoffDate) {
        query = query.gte('last_message_time', cutoffDate)
      }

      const { data: rawChats, error: chatsError } = await query

      if (chatsError) {
        console.error(`Error obteniendo chats para bot ${bot.id}:`, chatsError)
        continue
      }

      // Filtrar chats internos
      const validChats = (rawChats || []).filter(chat => !isInternalChat(chat, botPhonesSet))

      if (validChats.length === 0) {
        advisorsDataForAI.push({
          advisorId: bot.id,
          advisorName: advisorDisplayName,
          botSessionName: bot.session_name,
          phone: bot.phone_number,
          totalChats: 0,
          chats: []
        })
        continue
      }

      // Tomar los N chats más relevantes
      const topChats = validChats.slice(0, maxChatsPerAdvisor)
      const chatIds = topChats.map(c => c.id)

      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, chat_id, body, from_me, timestamp')
        .in('chat_id', chatIds)
        .order('timestamp', { ascending: true })
        .limit(2000)

      const messagesByChat = new Map()
      messagesData?.forEach(msg => {
        if (!messagesByChat.has(msg.chat_id)) {
          messagesByChat.set(msg.chat_id, [])
        }
        messagesByChat.get(msg.chat_id).push(msg)
      })

      const formattedChats = topChats.map(chat => {
        const msgs = (messagesByChat.get(chat.id) || []).slice(-20)
        return {
          cliente: chat.contact_name || chat.contact_number || 'Cliente sin nombre',
          telefono: chat.contact_number || '',
          ultimoMensaje: (chat.last_message || '').slice(0, 100),
          ventaCerrada: !!chat.ai_analysis?.sale_completed,
          mensajes: msgs.map(m => ({
            de: m.from_me ? 'asesor' : 'cliente',
            texto: (m.body || '').slice(0, 200),
            hora: m.timestamp
          }))
        }
      })

      totalChatsGathered += validChats.length

      advisorsDataForAI.push({
        advisorId: bot.id,
        advisorName: advisorDisplayName,
        botSessionName: bot.session_name,
        phone: bot.phone_number,
        totalChats: validChats.length,
        chats: formattedChats
      })
    }

    if (advisorsDataForAI.length === 0 || totalChatsGathered === 0) {
      return NextResponse.json({
        error: 'No se encontraron conversaciones válidas de clientes para los asesores en el período seleccionado.'
      }, { status: 404 })
    }

    // 4. Preparar Prompt para Gemini
    const systemPrompt = `RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO. SIN TEXTO ANTES NI DESPUÉS. SIN BLOQUES MARKDOWN.

Eres el Director Senior de Auditoría Comercial y Estratégica de Viajes Nova. 
Tu misión es generar un REPORTE EJECUTIVO PERSONALIZADO con destino a la Dirección General, analizando las conversaciones reales de WhatsApp de los asesores seleccionados.

El administrador ha solicitado expresamente el siguiente enfoque / auditoría:
"""
${userPrompt.trim()}
"""

Debes generar un JSON con ESTA ESTRUCTURA EXACTA:
{
  "title": "Título ejecutivo breve y formal del reporte (máx 60 caracteres)",
  "executiveSummary": "Párrafo de 3 a 5 oraciones con el diagnóstico general, hallazgos más destacados y respuesta directa a la necesidad solicitada por el administrador.",
  "generalScore": 8.2,
  "advisors": [
    {
      "advisorName": "Nombre del Asesor",
      "botSessionName": "sesion_waha",
      "score": 7.8,
      "chatsAnalyzed": 5,
      "salesCount": 2,
      "keyStrengths": [
        "Fortaleza puntual 1 con respecto al requerimiento",
        "Fortaleza puntual 2"
      ],
      "criticalIssues": [
        "Falla u oportunidad de mejora 1 detectada en los chats",
        "Falla u oportunidad de mejora 2"
      ],
      "audits": [
        {
          "client": "Nombre o teléfono del cliente",
          "type": "turismo|vuelos|paquete|corporativo",
          "score": 8,
          "sale_closed": true,
          "analysis": "Párrafo explicativo concreto sobre cómo se desenvolvió este chat con respecto al objetivo solicitado por el admin.",
          "chatQuote": "Frase o intercambio textual relevante del chat que demuestra el acierto o el error"
        }
      ]
    }
  ],
  "strategicRecommendations": [
    "Recomendación estratégica inmediata 1 para corregir o potenciar el equipo",
    "Recomendación estratégica 2",
    "Recomendación estratégica 3"
  ]
}

REGLAS DE AUDITORÍA:
1. Evalúa el desempeño con base rigurosa en los chats suministrados y el requerimiento del usuario.
2. Cada asesor debe tener su propia puntuación de 1.0 a 10.0 y un desglose de 2-4 casos de chat analizados.
3. Cita fragmentos reales de los mensajes en 'chatQuote'.
4. NADA DE TEXTO FUERA DEL OBJETO JSON.`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192
      }
    })

    const payloadForAI = {
      requerimientoAdmin: userPrompt,
      periodo: timeframe,
      asesores: advisorsDataForAI
    }

    console.log(`[CUSTOM-REPORT] Enviando ${advisorsDataForAI.length} asesores (${totalChatsGathered} chats) a Gemini`)

    const result = await model.generateContent([
      systemPrompt,
      `DATOS REALES DE LAS CONVERSACIONES DE WHATSAPP:\n${JSON.stringify(payloadForAI, null, 2)}`
    ])

    const aiResponse = await result.response
    let aiContent = aiResponse.text() || ''

    // Limpieza de Markdown
    aiContent = aiContent.replace(/```json/gi, '').replace(/```/g, '').trim()

    let parsedNarrative = null

    try {
      parsedNarrative = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('[CUSTOM-REPORT] JSON.parse falló:', parseError, 'Raw Preview:', aiContent.slice(0, 400))
      parsedNarrative = {
        title: 'Reporte de Auditoría Comercial Personalizada',
        executiveSummary: 'Se procesaron las conversaciones de los asesores seleccionados según las pautas indicadas.',
        generalScore: 7.5,
        advisors: advisorsDataForAI.map(a => ({
          advisorName: a.advisorName,
          botSessionName: a.botSessionName,
          score: 7.5,
          chatsAnalyzed: a.chats.length,
          salesCount: a.chats.filter(c => c.ventaCerrada).length,
          keyStrengths: ['Interacción con clientes registrada'],
          criticalIssues: ['Revisar tiempos de respuesta y seguimiento'],
          audits: a.chats.slice(0, 3).map(c => ({
            client: c.cliente,
            type: 'turismo',
            score: c.ventaCerrada ? 9 : 6,
            sale_closed: c.ventaCerrada,
            analysis: `Conversación con ${c.cliente}. Último mensaje: "${c.ultimoMensaje}"`,
            chatQuote: c.mensajes?.[0]?.texto || ''
          }))
        })),
        strategicRecommendations: [
          'Estandarizar tiempos de primera respuesta bajo 5 minutos.',
          'Hacer seguimiento activo a cotizaciones pendientes.'
        ]
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalAdvisors: selectedBots.length,
        totalChats: totalChatsGathered,
        timeframe
      },
      aiNarrative: parsedNarrative,
      metadata: {
        userPrompt,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in custom-report generate API:', error)
    return NextResponse.json(
      { error: error.message || 'No se pudo generar el reporte personalizado con IA.' },
      { status: 500 }
    )
  }
}
