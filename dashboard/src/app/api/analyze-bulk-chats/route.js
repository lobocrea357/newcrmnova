import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ==================== CONFIGURACIÓN DE FILTROS ====================

// Bots a EXCLUIR completamente del análisis
const EXCLUDED_BOTS = [
  'abraham_nova',
  'abrahama_apolo', 
  'abraham_flash',
  'paul_hernandez_colombia_endry'
]

// Nombres de grupos internos a excluir (match flexible)
const EXCLUDED_GROUP_NAMES = [
  'cotizaciones apolo',
  'viajes nova team',
  'viajes nova',
  'consultas nova colombia equipo paola✨✈️',
  'emisiones estelar',
  'pagos de contado estelar',
  'nova colombia pago financiamiento',
  'emisiones colombia nova',
  'pago colombia de contado',
  'emisiones grupo nova call 💻',
  'consultas y reportes',
  'reporte de ventas',
  'grupo de asesores',
  'equipo nova',
  'equipo apolo',
  'equipo flash'
]

// Palabras clave para excluir grupos/chats (case insensitive)
const EXCLUDED_KEYWORDS = [
  'emisiones',
  'cotizaciones', 
  'pagos',
  'contado',
  'financiamiento',
  'notificaciones',
  'team',
  'nova',
  'apolo',
  'flash',
  'colombia',
  'reembolsos'
]

// Nombres de gerentes/personal interno a excluir
const EXCLUDED_MANAGERS = [
  'endry guevara',
  'moises guevara',
  'moisés guevara',
  'jesus diaz',
  'jesús díaz',
  'jesus díaz',
  'jesús diaz'
]

// ==================== FUNCIONES DE FILTRADO ====================

/**
 * Verifica si un bot debe ser excluido
 */
function isBotExcluded(botName) {
  if (!botName) return false
  const normalizedName = botName.toLowerCase().trim()
  return EXCLUDED_BOTS.some(excluded => normalizedName.includes(excluded.toLowerCase()))
}

/**
 * Verifica si un chat debe ser excluido por nombre de grupo (match flexible)
 */
function isExcludedByExactName(chatName) {
  if (!chatName) return false
  const normalizedName = chatName.toLowerCase().trim()
  // Match más flexible: exacto, contiene, o es contenido
  return EXCLUDED_GROUP_NAMES.some(excluded => {
    const excludedNorm = excluded.toLowerCase()
    return normalizedName === excludedNorm || 
           normalizedName.includes(excludedNorm) ||
           (excludedNorm.length > 10 && excludedNorm.includes(normalizedName))
  })
}

/**
 * Detecta si un nombre es puramente numérico (típico de grupos/IDs)
 */
function isNumericName(chatName) {
  if (!chatName) return false
  const normalized = chatName.trim()
  // Si es 100% dígitos o tiene más de 8 dígitos consecutivos
  return /^\d+$/.test(normalized) || /\d{8,}/.test(normalized)
}

/**
 * Detecta patrones de nombres de empleados/asesores internos
 * Ej: "Johan Emisiones", "Agente Esthefanni", "Efrain Flash"
 */
function isInternalStaffPattern(chatName) {
  if (!chatName) return false
  const normalized = chatName.toLowerCase().trim()
  
  // Patrón: "Agente [Nombre]" o "Asesor [Nombre]"
  if (/^(agente|asesor|asesora)\s+/i.test(normalized)) return true
  
  // Patrón: "[Nombre] Emisiones/Cotizaciones/Pagos" (nombre corto + palabra operativa)
  // Solo si es un nombre corto (1-2 palabras antes de la operativa)
  const staffPatterns = [
    /^[a-záéíóúñ]+\s+emisiones$/i,
    /^[a-záéíóúñ]+\s+cotizaciones$/i,
    /^[a-záéíóúñ]+\s+pagos$/i,
    /^[a-záéíóúñ]+\s+reembolsos$/i
  ]
  if (staffPatterns.some(p => p.test(normalized))) return true
  
  // Patrón: "[Nombre solo] [Empresa]" (nombre corto + empresa sin más contexto)
  // Ej: "Carlos Nova", "Maria Apolo" pero NO "Juan Carlos de Nova Tours"
  const singleNameWithCompany = /^[a-záéíóúñ]+\s+(nova|apolo|flash|estelar)$/i
  if (singleNameWithCompany.test(normalized)) return true
  
  return false
}

/**
 * Cuenta cuántos indicadores de grupo interno tiene un nombre
 * NO excluye automáticamente - solo cuenta
 */
function countGroupIndicators(chatName) {
  if (!chatName) return 0
  const normalized = chatName.toLowerCase().trim()
  let indicators = 0

  // Palabras operativas (emisiones, pagos, etc.)
  const operativeWords = ['emisiones', 'cotizaciones', 'pagos', 'reembolsos', 'pasajeros', 'reembolsables', 'consultas']
  const hasOperative = operativeWords.some(w => normalized.includes(w))
  if (hasOperative) indicators++

  // Palabras de empresa
  const companyWords = ['nova', 'apolo', 'flash', 'estelar', 'colombia']
  const hasCompany = companyWords.some(w => normalized.includes(w))
  if (hasCompany) indicators++

  // Palabras de modalidad/tipo
  const modalityWords = ['contado', 'credito', 'financiamiento', 'team', 'equipo', 'grupo', 'viajes']
  const hasModality = modalityWords.some(w => normalized.includes(w))
  if (hasModality) indicators++

  // Formato sospechoso: muy corto o con muchos números
  if (normalized.length < 10 || /\d{5,}/.test(normalized)) {
    indicators++
  }

  // Múltiples palabras operativas
  const operativeCount = operativeWords.filter(w => normalized.includes(w)).length
  if (operativeCount >= 2) indicators++

  // Patrón: "Consultas y [algo]" o "[algo] y Reportes" - peso alto
  if (/\by\s+(reportes|consultas|emisiones|pagos)/i.test(normalized) ||
      /^consultas\s+/i.test(normalized) ||
      /\sreportes$/i.test(normalized)) {
    indicators += 2  // Peso alto para patrones administrativos
  }

  return indicators
}

/**
 * Verifica si un chat es con un gerente/personal interno
 */
function isManagerChat(contactName) {
  if (!contactName) return false
  const normalizedName = contactName.toLowerCase().trim()
  return EXCLUDED_MANAGERS.some(manager => normalizedName.includes(manager.toLowerCase()))
}

/**
 * Verifica si es un chat de grupo (típicamente tienen @g.us)
 */
function isGroupChat(chatId) {
  if (!chatId) return false
  return chatId.includes('@g.us')
}

/**
 * Sistema de filtrado INTELIGENTE que NO descarta clientes reales
 * CRÍTICO: Se aplica a TODOS los chats (incluso con ai_analysis previo)
 */
function shouldExcludeChat(chat) {
  const contactName = chat.contact_name || ''
  const chatId = chat.chat_id || ''
  
  // 1. PRIORIDAD MÁXIMA: Excluir nombres puramente numéricos
  if (isNumericName(contactName)) {
    return { excluded: true, reason: 'Nombre numérico (grupo/ID)' }
  }
  
  // 2. PRIORIDAD ALTA: Excluir por nombre exacto de grupo (lista verificada)
  if (isExcludedByExactName(contactName)) {
    return { excluded: true, reason: 'Grupo interno confirmado (nombre exacto)' }
  }
  
  // 3. PRIORIDAD ALTA: Excluir chats con gerentes/personal interno
  if (isManagerChat(contactName)) {
    return { excluded: true, reason: 'Chat con gerente/personal interno' }
  }
  
  // 4. NUEVO: Detectar patrones de nombres de staff interno
  // Ej: "Johan Emisiones", "Agente Esthefanni", "Carlos Nova"
  if (isInternalStaffPattern(contactName)) {
    return { excluded: true, reason: 'Patrón de nombre interno (staff)' }
  }
  
  // 5. Excluir status, broadcast, newsletter
  if (chatId.includes('status') || chatId.includes('@broadcast') || chatId.includes('@newsletter')) {
    return { excluded: true, reason: 'Status/Broadcast/Newsletter' }
  }
  
  // 6. SISTEMA INTELIGENTE: Contar indicadores de grupo interno
  // Reducido a 2+ indicadores para mayor precisión
  const indicatorCount = countGroupIndicators(contactName)
  if (indicatorCount >= 2) {
    return { excluded: true, reason: `Patrón de grupo interno (${indicatorCount} indicadores)` }
  }
  
  // Si tiene solo 1 indicador, NO excluir (puede ser cliente real)
  return { excluded: false, reason: null }
}

// ==================== PROMPT DE ANÁLISIS ====================

const DEFAULT_ANALYSIS_PROMPT = `Eres un experto analista de ventas y calidad de atención al cliente especializado en venta de boletos/tickets de viaje.

Analiza la siguiente conversación de WhatsApp entre un Asesor y un Cliente.

## CRITERIOS PARA DETERMINAR SI LA VENTA SE CONCRETÓ:

Una venta se considera CONCRETADA (sale_completed: true) ÚNICAMENTE cuando se cumplen AMBAS condiciones:
1. **Confirmación de pago**: El cliente realizó el pago (completo o financiado) Y el asesor confirma haberlo recibido/verificado.
2. **Emisión del boleto/ticket**: El asesor menciona que va a emitir, está emitiendo, o ya emitió el boleto/ticket. Frases clave: "voy a emitir", "estás en lista de emisión", "procedo con la emisión", "tu boleto está siendo emitido", etc.

Una venta NO está concretada (sale_completed: false) si:
- Solo hubo cotización o consulta de precios
- El cliente mostró interés pero no pagó
- Hubo negociación pero sin cierre
- El cliente pidió tiempo para pensar
- No hay mención de confirmación de pago NI emisión de boleto

## TU TAREA:
1. Determinar si la venta se concretó según los criterios anteriores
2. Evaluar la calidad de atención del asesor (amabilidad, rapidez, claridad, proactividad)
3. Identificar momentos clave de la conversación
4. Si no hubo venta, explicar brevemente por qué

## FORMATO DE RESPUESTA (JSON estricto):
{
  "sale_completed": boolean,
  "failure_reason": string,
  "advisor_performance": string,
  "key_moments": string[]
}`

// Prompt para validación IA EN LOTE de si son chats de clientes reales
const BATCH_VALIDATION_PROMPT = `Eres un clasificador experto. Analiza MÚLTIPLES conversaciones y determina cuáles son con CLIENTES REALES.

## CLIENTE REAL:
- Persona externa consultando precios, productos, servicios de viajes
- Conversación uno-a-uno entre asesor y cliente potencial
- Preguntas sobre destinos, fechas, disponibilidad, formas de pago

## NO ES CLIENTE (EXCLUIR):
- Grupos internos de trabajo (emisiones, pagos, cotizaciones, coordinación)
- Conversaciones entre empleados/gerentes
- Chats con nombres de empresas (Nova, Apolo, Flash, Colombia)
- Grupos con palabras como: equipo, team, grupo, viajes, contado, crédito
- Nombres puramente numéricos o IDs
- Múltiples personas hablando (grupo)

## INDICADORES DE GRUPO INTERNO:
- Menciones a "equipo", "emisiones", "pagos internos", "coordinación"
- Múltiples personas participando en la conversación
- Lenguaje operativo interno (no comercial)

Responde con JSON array:
{
  "results": [
    {"chat_index": 0, "is_real_client": boolean, "confidence": number, "reason": string},
    ...
  ]
}`

/**
 * Prepara un resumen corto de mensajes para validación
 * Usa los 30 mensajes MÁS RECIENTES para mejor precisión
 */
function prepareChatSummary(messages, maxMessages = 30) {
  if (!messages || messages.length < 3) return null
  
  // Tomar los últimos 30 mensajes (más recientes) para mayor precisión
  const recentMessages = messages.slice(-maxMessages)
  const transcript = recentMessages
    .filter(m => m.body || m.content)
    .map(m => {
      const sender = m.from_me ? 'A' : 'C' // Asesor/Cliente abreviado
      const body = (m.body || m.content || '').substring(0, 150)
      return `${sender}: ${body}`
    })
    .join('\n')
  
  return transcript.length >= 30 ? transcript : null
}

/**
 * Valida MÚLTIPLES chats en UNA sola llamada a OpenAI (BATCH)
 * Reduce llamadas de N a 1
 */
async function validateClientChatsBatch(chatsWithMessages) {
  if (!chatsWithMessages || chatsWithMessages.length === 0) {
    return []
  }

  // Preparar resúmenes de cada chat
  const chatSummaries = chatsWithMessages.map((chat, index) => {
    const summary = prepareChatSummary(chat.messages)
    return { index, chatId: chat.id, contactName: chat.contact_name, summary }
  })

  // Filtrar chats sin contenido suficiente
  const validSummaries = chatSummaries.filter(s => s.summary !== null)
  const invalidChats = chatSummaries.filter(s => s.summary === null)

  // Marcar chats inválidos como no-clientes
  const results = invalidChats.map(s => ({
    chatId: s.chatId,
    is_real_client: false,
    confidence: 85,
    reason: 'Contenido insuficiente para validar'
  }))

  if (validSummaries.length === 0) {
    return results
  }

  // Construir prompt con todos los chats
  const batchContent = validSummaries.map((s, i) => 
    `--- CHAT ${i} (${s.contactName}) ---\n${s.summary}`
  ).join('\n\n')

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: BATCH_VALIDATION_PROMPT },
        { role: 'user', content: `Analiza estos ${validSummaries.length} chats:\n\n${batchContent}` }
      ],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' },
      max_tokens: 500
    })

    const batchResults = JSON.parse(completion.choices[0].message.content)
    
    // Mapear resultados a los chats originales
    batchResults.results?.forEach(r => {
      const originalChat = validSummaries[r.chat_index]
      if (originalChat) {
        results.push({
          chatId: originalChat.chatId,
          is_real_client: r.is_real_client,
          confidence: r.confidence || 75,
          reason: r.reason || 'Validado por IA'
        })
      }
    })

    return results
  } catch (error) {
    console.warn('Error en validación batch:', error.message)
    // En caso de error, asumir todos como clientes
    return validSummaries.map(s => ({
      chatId: s.chatId,
      is_real_client: true,
      confidence: 50,
      reason: 'Error en validación, asumido como cliente'
    }))
  }
}

function prepareTranscript(messages) {
  return messages
    .filter(m => m.type === 'text' || m.type === 'image' || m.type === 'audio' || !m.type)
    .map(m => {
      const sender = m.from_me ? 'Asesor' : 'Cliente'
      const time = m.timestamp ? new Date(m.timestamp).toLocaleString('es-ES') : ''
      const body = m.body || m.content || '[Multimedia]'
      return `[${time}] ${sender}: ${body}`
    })
    .join('\n')
}

function calculateResponseMetrics(messages) {
  let maxResponseTime = 0
  let hasLongDelay = false
  let longDelayDetails = null
  const responseTimes = []

  for (let i = 1; i < messages.length; i++) {
    const prevMsg = messages[i - 1]
    const currMsg = messages[i]

    if (!prevMsg.from_me && currMsg.from_me && prevMsg.timestamp && currMsg.timestamp) {
      const prevTime = new Date(prevMsg.timestamp).getTime()
      const currTime = new Date(currMsg.timestamp).getTime()
      const diffMinutes = (currTime - prevTime) / (1000 * 60)

      if (diffMinutes >= 0 && diffMinutes < 60 * 24 * 7) {
        responseTimes.push(diffMinutes)
        
        if (diffMinutes > maxResponseTime) {
          maxResponseTime = diffMinutes
        }

        if (diffMinutes > 30 && !hasLongDelay) {
          hasLongDelay = true
          longDelayDetails = `Demora de ${Math.round(diffMinutes)} min después del mensaje: "${prevMsg.body?.substring(0, 50) || '[Mensaje]'}..."`
        }
      }
    }
  }

  const avgResponseTime = responseTimes.length > 0
    ? Number((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1))
    : null

  return {
    avgResponseTime,
    maxResponseTime: Number(maxResponseTime.toFixed(1)),
    hasLongDelay,
    longDelayDetails
  }
}

async function analyzeChat(chat, customPrompt) {
  const messages = chat.messages || []
  
  if (messages.length === 0) {
    return {
      chatId: chat.id,
      contactName: chat.contact_name,
      botName: chat.bot_name,
      error: 'No hay mensajes para analizar',
      analysis: null
    }
  }

  const transcript = prepareTranscript(messages)
  const metrics = calculateResponseMetrics(messages)

  const systemPrompt = customPrompt || DEFAULT_ANALYSIS_PROMPT

  const userMessage = `
Aquí tienes la transcripción del chat:
---
${transcript}
---

Información adicional del sistema:
- ¿Hubo demoras de >30 min en responder al cliente?: ${metrics.hasLongDelay ? 'SÍ' : 'NO'}
${metrics.hasLongDelay ? `- Detalle de la demora: ${metrics.longDelayDetails}` : ''}

Por favor, analiza la conversación y genera el JSON solicitado.
`

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' },
    })

    const analysisResult = JSON.parse(completion.choices[0].message.content)

    return {
      chatId: chat.id,
      contactName: chat.contact_name,
      botName: chat.bot_name,
      messageCount: messages.length,
      lastMessageTime: chat.last_message_time,
      metrics,
      analysis: {
        ...analysisResult,
        system_detected_delay: {
          has_long_delay: metrics.hasLongDelay,
          details: metrics.longDelayDetails
        }
      }
    }
  } catch (error) {
    console.error(`Error analizando chat ${chat.id}:`, error)
    return {
      chatId: chat.id,
      contactName: chat.contact_name,
      botName: chat.bot_name,
      error: error.message,
      analysis: null
    }
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

    const { customPrompt, chatsPerBot = 15 } = await request.json()

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

    // PASO 1: Obtener TODOS los bots activos
    console.log('📊 Obteniendo todos los bots...')
    const { data: allBots, error: botsError } = await supabase
      .from('bots')
      .select('id, session_name, phone_number')
      .order('session_name', { ascending: true })

    if (botsError) {
      console.error('Error fetching bots:', botsError)
      return NextResponse.json(
        { error: 'No se pudieron obtener los bots' },
        { status: 500 }
      )
    }

    if (!allBots || allBots.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron bots configurados' },
        { status: 404 }
      )
    }

    console.log(`✅ ${allBots.length} bots encontrados`)

    // PASO 2: Filtrar bots excluidos
    const validBots = allBots.filter(bot => {
      if (isBotExcluded(bot.session_name)) {
        console.log(`   🚫 Bot excluido: ${bot.session_name}`)
        return false
      }
      return true
    })

    console.log(`✅ ${validBots.length} bots válidos después de filtrar excluidos`)

    // PASO 3: Para CADA bot válido, obtener chats con COMPENSACIÓN
    // Objetivo: siempre obtener exactamente chatsPerBot (15) conversaciones válidas de clientes reales
    let chatsWithMessages = []
    const filterStats = {
      totalChatsEvaluated: 0,
      excludedByStructuralFilter: 0,
      excludedByAIValidation: 0,
      validClientChats: 0
    }

    // Función para procesar UN bot (se ejecutará en paralelo)
    async function processBot(bot) {
      const result = { botName: bot.session_name, validChats: [], stats: { evaluated: 0, structuralExcluded: 0, aiExcluded: 0 } }
      
      try {
        let offset = 0
        const batchSize = 60 // Traer más para compensar
        let attempts = 0
        const maxAttempts = 3

        console.log(`\n📱 Procesando: ${bot.session_name}`)

        while (result.validChats.length < chatsPerBot && attempts < maxAttempts) {
          attempts++
          
          // Obtener lote de chats (INCLUYE chats con ai_analysis para sobrescribir)
          const { data: botChats, error: chatsError } = await supabase
            .from('chats')
            .select('id, chat_id, contact_name, contact_number, last_message_time, bot_id, ai_analysis')
            .eq('bot_id', bot.id)
            .not('chat_id', 'ilike', '%status%')
            .not('chat_id', 'ilike', '%@broadcast%')
            .not('chat_id', 'ilike', '%@newsletter%')
            .order('last_message_time', { ascending: false, nullsLast: true })
            .range(offset, offset + batchSize - 1)

          if (chatsError || !botChats?.length) break

          result.stats.evaluated += botChats.length

          // Obtener mensajes
          const batchChatIds = botChats.map(c => c.id)
          const { data: batchMessages } = await supabase
            .from('messages')
            .select('id, chat_id, body, content, from_me, timestamp, type')
            .in('chat_id', batchChatIds)
            .order('timestamp', { ascending: true })
            .limit(5000)

          // Agrupar mensajes
          const messagesByChat = new Map()
          batchMessages?.forEach(msg => {
            if (!messagesByChat.has(msg.chat_id)) messagesByChat.set(msg.chat_id, [])
            messagesByChat.get(msg.chat_id).push(msg)
          })

          // PASO 1: Filtro estructural SIEMPRE (sin excepciones)
          const structurallyValid = []
          const previouslyAnalyzed = []
          
          for (const chat of botChats) {
            let contactName = chat.contact_name || chat.contact_number || 'Sin nombre'
            if (chat.chat_id && contactName === 'Sin nombre') contactName = chat.chat_id.split('@')[0]
            chat.contact_name = contactName

            const msgs = messagesByChat.get(chat.id) || []
            if (msgs.length === 0) continue

            // CRÍTICO: Aplicar filtros estructurales a TODOS los chats (incluso previamente analizados)
            const check = shouldExcludeChat(chat)
            if (check.excluded) {
              result.stats.structuralExcluded++
              console.log(`  ❌ Excluido: "${contactName}" - ${check.reason}`)
              continue
            }

            const chatWithMessages = { ...chat, messages: msgs, bot_name: bot.session_name, bot_phone: bot.phone_number }

            // Si pasó los filtros Y ya fue analizado, priorizarlo para sobrescritura
            if (chat.ai_analysis && typeof chat.ai_analysis === 'object') {
              previouslyAnalyzed.push(chatWithMessages)
            } else {
              structurallyValid.push(chatWithMessages)
            }
          }

          // PASO 2: Agregar chats previamente analizados PRIMERO (sin validación IA adicional)
          for (const chat of previouslyAnalyzed) {
            if (result.validChats.length >= chatsPerBot) break
            result.validChats.push({ 
              ...chat, 
              validation: { is_real_client: true, confidence: 100, reason: 'Chat con análisis previo (sobrescribir)' }
            })
          }

          // PASO 3: Validación IA EN LOTE para chats nuevos (una sola llamada para todo el batch)
          if (result.validChats.length < chatsPerBot && structurallyValid.length > 0) {
            const validationResults = await validateClientChatsBatch(structurallyValid)
            const validationMap = new Map(validationResults.map(v => [v.chatId, v]))

            for (const chat of structurallyValid) {
              if (result.validChats.length >= chatsPerBot) break

              const validation = validationMap.get(chat.id) || { is_real_client: true, confidence: 50 }
              
              if (!validation.is_real_client && validation.confidence > 70) {
                result.stats.aiExcluded++
                continue
              }

              result.validChats.push({ ...chat, validation })
            }
          }

          offset += batchSize
        }

        console.log(`   ✅ ${bot.session_name}: ${result.validChats.length} chats válidos`)
        return result

      } catch (err) {
        console.warn(`⚠️ Error en ${bot.session_name}:`, err.message)
        return result
      }
    }

    // Procesar bots en paralelo con concurrencia limitada (5 a la vez)
    const CONCURRENCY = 5
    const botResults = []
    
    for (let i = 0; i < validBots.length; i += CONCURRENCY) {
      const batch = validBots.slice(i, i + CONCURRENCY)
      console.log(`\n🔄 Procesando lote de ${batch.length} bots (${i + 1}-${Math.min(i + CONCURRENCY, validBots.length)} de ${validBots.length})...`)
      
      const batchResults = await Promise.all(batch.map(bot => processBot(bot)))
      botResults.push(...batchResults)
    }

    // Consolidar resultados
    for (const result of botResults) {
      chatsWithMessages = chatsWithMessages.concat(result.validChats)
      filterStats.totalChatsEvaluated += result.stats.evaluated
      filterStats.excludedByStructuralFilter += result.stats.structuralExcluded
      filterStats.excludedByAIValidation += result.stats.aiExcluded
      filterStats.validClientChats += result.validChats.length
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 ESTADÍSTICAS DE FILTRADO:')
    console.log(`   Total chats evaluados: ${filterStats.totalChatsEvaluated}`)
    console.log(`   Excluidos por filtro estructural: ${filterStats.excludedByStructuralFilter}`)
    console.log(`   Excluidos por validación IA: ${filterStats.excludedByAIValidation}`)
    console.log(`   Chats de clientes válidos: ${filterStats.validClientChats}`)
    console.log('='.repeat(50) + '\n')

    if (chatsWithMessages.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron conversaciones de clientes válidas para analizar' },
        { status: 404 }
      )
    }

    console.log(`📊 Total: ${chatsWithMessages.length} chats de clientes reales para analizar`)

    // Analizar chats con concurrencia limitada (evitar sobrecarga de API)
    const ANALYSIS_CONCURRENCY = 10
    const analysisResults = []
    
    for (let i = 0; i < chatsWithMessages.length; i += ANALYSIS_CONCURRENCY) {
      const batch = chatsWithMessages.slice(i, i + ANALYSIS_CONCURRENCY)
      console.log(`   🔍 Analizando chats ${i + 1}-${Math.min(i + ANALYSIS_CONCURRENCY, chatsWithMessages.length)} de ${chatsWithMessages.length}...`)
      
      const batchResults = await Promise.all(batch.map(chat => analyzeChat(chat, customPrompt)))
      analysisResults.push(...batchResults)
    }
    
    console.log(`✅ Análisis completado: ${analysisResults.length} chats procesados`)

    // Calcular estadísticas del reporte
    const successfulAnalyses = analysisResults.filter(r => r.analysis !== null)
    const failedAnalyses = analysisResults.filter(r => r.analysis === null)

    const summary = {
      totalChatsAnalyzed: chatsWithMessages.length,
      successfulAnalyses: successfulAnalyses.length,
      failedAnalyses: failedAnalyses.length,
      salesCompleted: successfulAnalyses.filter(r => r.analysis?.sale_completed).length,
      salesNotCompleted: successfulAnalyses.filter(r => !r.analysis?.sale_completed).length,
      totalMessages: chatsWithMessages.reduce((sum, chat) => sum + chat.messages.length, 0),
      averageResponseTime: null,
      worstResponseTime: null,
      chatsWithDelays: successfulAnalyses.filter(r => r.analysis?.system_detected_delay?.has_long_delay).length,
      // Estadísticas de filtrado
      filterStats: {
        totalEvaluated: filterStats.totalChatsEvaluated,
        excludedStructural: filterStats.excludedByStructuralFilter,
        excludedByAI: filterStats.excludedByAIValidation,
        validClients: filterStats.validClientChats
      }
    }

    // Calcular tiempos de respuesta promedio
    const allResponseTimes = successfulAnalyses
      .filter(r => r.metrics?.avgResponseTime !== null)
      .map(r => r.metrics.avgResponseTime)

    if (allResponseTimes.length > 0) {
      summary.averageResponseTime = Number(
        (allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length).toFixed(1)
      )
      summary.worstResponseTime = Number(
        Math.max(...successfulAnalyses.filter(r => r.metrics?.maxResponseTime).map(r => r.metrics.maxResponseTime)).toFixed(1)
      )
    }

    // Agrupar por bot para el reporte
    const analysisByBot = {}
    successfulAnalyses.forEach(result => {
      const botName = result.botName || 'Desconocido'
      if (!analysisByBot[botName]) {
        analysisByBot[botName] = {
          chats: [],
          salesCompleted: 0,
          salesNotCompleted: 0
        }
      }
      analysisByBot[botName].chats.push(result)
      if (result.analysis?.sale_completed) {
        analysisByBot[botName].salesCompleted++
      } else {
        analysisByBot[botName].salesNotCompleted++
      }
    })

    // Guardar análisis en la base de datos para cada chat
    for (const result of successfulAnalyses) {
      if (result.analysis) {
        try {
          await supabase
            .from('chats')
            .update({ ai_analysis: result.analysis })
            .eq('id', result.chatId)
        } catch (err) {
          console.warn(`No se pudo guardar análisis para chat ${result.chatId}:`, err.message)
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      analyses: successfulAnalyses,
      failedAnalyses: failedAnalyses.map(f => ({ chatId: f.chatId, contactName: f.contactName, error: f.error })),
      analysisByBot,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in bulk analysis:', error)
    return NextResponse.json(
      { error: error.message || 'Error al realizar el análisis masivo' },
      { status: 500 }
    )
  }
}
