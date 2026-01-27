import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Obtiene todos los workers con sus estadísticas
 */
export async function getAllWorkers() {
  const { data: workers, error } = await supabase
    .from('workers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('❌ Error al obtener workers:', error)
    return []
  }

  // Obtener estadísticas para cada worker
  const workersWithStats = await Promise.all(
    (workers || []).map(async (worker) => {
      const { count: botCount } = await supabase
        .from('bots')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', worker.id)

      const { count: chatCount } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .in('bot_id', await supabase
          .from('bots')
          .select('id')
          .eq('worker_id', worker.id)
          .then(({ data }) => data?.map(b => b.id) || [])
        )

      return {
        worker_id: worker.id,
        worker_name: worker.name,
        worker_email: worker.email,
        worker_status: worker.status,
        total_bots: botCount || 0,
        total_chats: chatCount || 0
      }
    })
  )

  return workersWithStats
}

/**
 * Obtiene todos los bots con el conteo de conversaciones
 */
export async function getAllBots() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.error('❌ No hay sesión activa')
    throw new Error('No hay sesión activa')
  }

  // OPTIMIZADO: Obtener bots con workers en una sola query usando JOIN
  const { data: bots, error } = await supabase
    .from('bots')
    .select(`
      *,
      worker:workers(id, name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error al obtener bots:', error)
    return []
  }

  // OPTIMIZADO: Obtener estadísticas de todos los bots en paralelo
  const botsWithDetails = await Promise.all(
    (bots || []).map(async (bot) => {
      // Ejecutar count y recentChat en paralelo en lugar de secuencial
      // Usamos filtro AND combinado para evitar error 406
      const [countResult, recentChatResult] = await Promise.all([
        // Contar chats válidos (filtro combinado con and)
        supabase
          .from('chats')
          .select('*', { count: 'exact', head: true })
          .eq('bot_id', bot.id)
          .not('chat_id', 'ilike', '%status%')
          .not('chat_id', 'ilike', '%@broadcast%'),
        
        // Obtener última actividad (sin doble order para evitar 406)
        supabase
          .from('chats')
          .select('last_message_time, updated_at, created_at')
          .eq('bot_id', bot.id)
          .not('chat_id', 'ilike', '%status%')
          .not('chat_id', 'ilike', '%@broadcast%')
          .order('last_message_time', { ascending: false, nullsLast: true })
          .limit(1)
          .maybeSingle()
      ])

      const validChatsCount = countResult.count || 0
      const recentChat = recentChatResult.data
      const lastActivity = recentChat?.last_message_time || recentChat?.updated_at || recentChat?.created_at || bot.created_at

      return {
        ...bot,
        worker: bot.worker || null,
        conversation_count: validChatsCount || 0,
        last_activity: lastActivity,
        last_activity_date: lastActivity ? new Date(lastActivity) : new Date(bot.created_at)
      }
    })
  )

  // Ordenar por actividad reciente (más recientes primero)
  const sortedBots = botsWithDetails.sort((a, b) => {
    // Primero por estado (activos primero)
    if (a.status === 'WORKING' && b.status !== 'WORKING') return -1
    if (b.status === 'WORKING' && a.status !== 'WORKING') return 1

    // Luego por fecha de última actividad (más reciente primero)
    return b.last_activity_date - a.last_activity_date
  })

  return sortedBots
}

/**
 * Obtiene los bots de un worker específico
 */
export async function getBotsByWorker(workerId) {
  const { data, error } = await supabase
    .from('bots')
    .select(`
      *,
      chats:chats(count)
    `)
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener bots por worker:', error)
    return []
  }

  return (data || []).map(bot => ({
    ...bot,
    conversation_count: bot.chats?.[0]?.count || 0
  }))
}

// Bots excluidos (prueba/testing - no son asesores reales)
const EXCLUDED_BOT_PATTERNS = [
  'abraham',
  'abrahama',
  'paul',
  'hernandez'
]

const PAYMENT_KEYWORDS = [
  'pago',
  'pagos',
  'pagar',
  'metodo de pago',
  'metodos de pago',
  'tarjeta',
  'transferencia',
  'efectivo',
  'deposito',
  'depósito',
  'zelle',
  'abono',
  'cuota',
  'pse',
  'paypal'
]

const normalizedPaymentKeywords = PAYMENT_KEYWORDS.map(keyword =>
  keyword
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
)

const normalizeText = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

// Verificar si un bot debe ser excluido (testing/prueba)
export const isBotExcluded = (sessionName = '') => {
  const normalized = normalizeText(sessionName)
  return EXCLUDED_BOT_PATTERNS.some(pattern => normalized.includes(pattern))
}

function analyzeConversationMetrics(messages = []) {
  if (!messages?.length) return null

  const responseTimes = []
  let lastClientMessageTime = null

  messages.forEach((msg) => {
    if (!msg?.timestamp) return
    const timestamp = new Date(msg.timestamp).getTime()

    if (!msg.from_me) {
      lastClientMessageTime = timestamp
      return
    }

    if (msg.from_me && lastClientMessageTime) {
      const diffMinutes = (timestamp - lastClientMessageTime) / (1000 * 60)
      if (diffMinutes >= 0 && diffMinutes < 60 * 24 * 7) {
        responseTimes.push(diffMinutes)
      }
      lastClientMessageTime = null
    }
  })

  const responseMetrics = responseTimes.length
    ? {
        averageMinutes: Number(
          (responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length).toFixed(1)
        ),
        maxMinutes: Number(Math.max(...responseTimes).toFixed(1)),
        samples: responseTimes.length
      }
    : null

  const paymentMentions = {
    count: 0,
    lastTimestamp: null,
    lastFromMe: null,
    lastSnippet: null,
    firstTimestamp: null
  }

  messages.forEach((msg) => {
    const rawBody = msg.body || msg.content || ''
    if (!rawBody) return

    const normalizedBody = normalizeText(rawBody)
    const containsPaymentKeyword = normalizedPaymentKeywords.some((keyword) =>
      normalizedBody.includes(keyword)
    )

    if (containsPaymentKeyword) {
      paymentMentions.count += 1
      const timestamp = msg.timestamp ? new Date(msg.timestamp).toISOString() : null

      if (!paymentMentions.firstTimestamp) {
        paymentMentions.firstTimestamp = timestamp
      }
      paymentMentions.lastTimestamp = timestamp
      paymentMentions.lastFromMe = !!msg.from_me
      paymentMentions.lastSnippet = rawBody.substring(0, 120)
    }
  })

  return {
    response: responseMetrics,
    paymentMentions: paymentMentions.count > 0 ? paymentMentions : null
  }
}

/**
 * Obtiene las conversaciones de un bot específico con paginación
 * OPTIMIZADO: Mejor manejo de nombres y números de contacto
 * @param {string} botId - ID del bot
 * @param {number} page - Número de página (empezando en 1)
 * @param {number} pageSize - Cantidad de conversaciones por página (default: 10)
 * @returns {Promise<{data: Array, total: number, totalPages: number, currentPage: number}>}
 */
export async function getConversationsByBot(botId, page = 1, pageSize = 10) {
  // console.log('🔍 Obteniendo conversaciones para bot:', botId, 'página:', page)

  // Primero obtener el total de conversaciones (excluyendo estados, canales y grupos)
  // FILTRO ESTRUCTURAL: Solo chats 1-a-1 con clientes
  const { count: totalCount, error: countError } = await supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })
    .eq('bot_id', botId)
    .eq('is_group', false)  // ← NUEVO: Excluir grupos
    .not('chat_id', 'ilike', '%status%')
    .not('chat_id', 'ilike', '%@broadcast%')
    .not('chat_id', 'ilike', '%@g.us')

  if (countError) {
    console.error('❌ Error al contar conversaciones:', countError)
    return { data: [], total: 0, totalPages: 0, currentPage: page }
  }

  const total = totalCount || 0
  const totalPages = Math.ceil(total / pageSize)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Obtener las conversaciones con mejor ordenamiento
  let query = supabase
    .from('chats')
    .select(`
      *,
      contact:contacts(id, name, phone_number, profile_picture_url, push_name)
    `)
    .eq('bot_id', botId)
    .eq('is_group', false)  // ← NUEVO: Excluir grupos
    .not('chat_id', 'ilike', '%status%')
    .not('chat_id', 'ilike', '%@broadcast%')
    .not('chat_id', 'ilike', '%@g.us')

  // Ordenar por last_message_time (descendente) - los NULL van al final
  query = query
    .order('last_message_time', { ascending: false, nullsFirst: false })

  query = query.range(from, to)

  const { data, error } = await query

  if (error) {
    console.error('❌ Error al obtener conversaciones:', error)
    return { data: [], total: 0, totalPages: 0, currentPage: page }
  }

  if (!data || data.length === 0) {
    return { data: [], total, totalPages, currentPage: page }
  }

  // OPTIMIZADO: Obtener mensajes de todos los chats EN PARALELO (Promise.all)
  // Esto es más rápido que secuencial y más seguro que batch query
  const chatsWithDetails = await Promise.all(
    data.map(async (chat) => {
      // Ejecutar todas las queries de este chat en paralelo
      const [countResult, lastMessageResult, allMessagesResult] = await Promise.all([
        // Contar mensajes
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id),
        
        // Obtener último mensaje
        supabase
          .from('messages')
          .select('body, timestamp, from_me')
          .eq('chat_id', chat.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle(),
        
        // Obtener todos los mensajes para métricas
        supabase
          .from('messages')
          .select('from_me, body, content, timestamp')
          .eq('chat_id', chat.id)
          .order('timestamp', { ascending: true })
      ])

      const count = countResult.count || 0
      const lastMessage = lastMessageResult.data
      const chatMessages = allMessagesResult.data || []

      // Calcular métricas detalladas si hay mensajes
      let conversationMetrics = null
      if (count > 0 && chatMessages.length > 0) {
        conversationMetrics = analyzeConversationMetrics(chatMessages)
      } else if (count > 0 && chatMessages.length === 0) {
        // Si hay count pero no mensajes, hay un problema - loggearlo
        console.warn(`⚠️ Chat ${chat.id} tiene ${count} mensajes pero no se cargaron`)
      }

      // OPTIMIZADO: Lógica mejorada para determinar nombre y número
      let displayName = 'Sin nombre'
      let displayPhone = ''
      let isValidContact = false

      // Prioridad 1: Contacto relacionado con nombre
      if (chat.contact?.name && chat.contact.name.trim() !== '') {
        displayName = chat.contact.name.trim()
        displayPhone = chat.contact.phone_number || chat.contact_number || ''
        isValidContact = true
      }
      // Prioridad 2: Push name del contacto
      else if (chat.contact?.push_name && chat.contact.push_name.trim() !== '') {
        displayName = chat.contact.push_name.trim()
        displayPhone = chat.contact.phone_number || chat.contact_number || ''
        isValidContact = true
      }
      // Prioridad 3: Nombre del chat (campo name)
      else if (chat.name && chat.name.trim() !== '') {
        displayName = chat.name.trim()
        displayPhone = chat.contact?.phone_number || chat.contact_number || ''
        isValidContact = true
      }
      // Prioridad 4: contact_name del chat
      else if (chat.contact_name && chat.contact_name.trim() !== '') {
        displayName = chat.contact_name.trim()
        displayPhone = chat.contact_number || ''
        isValidContact = true
      }
      // Prioridad 5: Número de teléfono del contacto
      else if (chat.contact?.phone_number) {
        displayName = chat.contact.phone_number
        displayPhone = chat.contact.phone_number
        isValidContact = true
      }
      // Prioridad 6: contact_number del chat
      else if (chat.contact_number) {
        displayName = chat.contact_number
        displayPhone = chat.contact_number
        isValidContact = true
      }
      // Prioridad 7: Extraer de chat_id (formato: 123456789@c.us)
      else if (chat.chat_id) {
        const phoneFromChatId = chat.chat_id.split('@')[0]
        if (phoneFromChatId && phoneFromChatId !== 'status') {
          displayName = phoneFromChatId
          displayPhone = phoneFromChatId
          isValidContact = true
        }
      }

      // Si tenemos un número válido pero no nombre, usar el número como nombre
      if (!isValidContact && displayPhone) {
        displayName = displayPhone
        isValidContact = true
      }

      // Logging mejorado para debugging
      if (!isValidContact && count > 0) {
        console.warn(`⚠️ Chat ${chat.id} tiene ${count} mensajes pero no se pudo determinar contacto válido`, {
          chat_id: chat.chat_id,
          contact_id: chat.contact_id,
          contact_name: chat.contact?.name,
          contact_push_name: chat.contact?.push_name,
          contact_phone: chat.contact?.phone_number,
          chat_name: chat.name,
          chat_contact_name: chat.contact_name,
          chat_contact_number: chat.contact_number
        })
      }

      return {
        ...chat,
        message_count: count || 0,
        contact_name: displayName,
        contact_phone: displayPhone,
        contact_profile_picture_url: chat.contact?.profile_picture_url || null,
        last_message_preview: lastMessage?.body?.substring(0, 100) || chat.last_message?.substring(0, 100) || '',
        last_message_timestamp: lastMessage?.timestamp || chat.last_message_time || chat.updated_at,
        last_message_from_me: lastMessage?.from_me || false,
        is_valid_contact: isValidContact,
        conversation_metrics: conversationMetrics
      }
    })
  )

  // IMPORTANTE: NO reordenar aquí con .sort() porque corrompe la paginación
  // El ordenamiento correcto ya viene de la base de datos (ORDER BY last_message_time DESC)
  const validChats = chatsWithDetails

  // IMPORTANTE: Usar el total original de la BD para calcular páginas correctamente
  // NO usar validChats.length porque eso solo cuenta las conversaciones de la página actual
  return {
    data: validChats,
    total: total,  // Total original de la BD
    totalPages: totalPages,  // Páginas calculadas del total original
    currentPage: page
  }
}

/**
 * Obtiene mensajes paginados de una conversación (para virtualización)
 * Carga los últimos N mensajes, soporta paginación hacia atrás
 * @param {string} chatId - ID del chat
 * @param {number} limit - Cantidad de mensajes a cargar (default: 50)
 * @param {string} beforeTimestamp - Timestamp para cargar mensajes anteriores (opcional)
 * @returns {Promise<{messages: Array, hasMore: boolean, totalMessages: number}>}
 */
export async function getPaginatedMessages(chatId, limit = 50, beforeTimestamp = null) {
  // Contar total de mensajes
  const { count: totalMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chatId)

  // Construir query para mensajes (SIN media_files JOIN para evitar timeout)
  let query = supabase
    .from('messages')
    .select(`
      id,
      body,
      content,
      type,
      from_me,
      timestamp,
      has_media,
      media_url,
      media_mimetype,
      metadata
    `)
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: false }) // Más recientes primero

  // Si hay beforeTimestamp, cargar mensajes anteriores a ese timestamp
  if (beforeTimestamp) {
    query = query.lt('timestamp', beforeTimestamp)
  }

  query = query.limit(limit)

  const { data: messages, error } = await query

  if (error) {
    console.error('❌ Error al cargar mensajes paginados:', error)
    return { messages: [], hasMore: false, totalMessages: 0 }
  }

  // Invertir para que estén en orden cronológico (más antiguos primero)
  const sortedMessages = (messages || []).reverse()

  // Determinar si hay más mensajes
  const hasMore = messages && messages.length === limit

  return {
    messages: sortedMessages,
    hasMore,
    totalMessages: totalMessages || 0
  }
}

/**
 * Obtiene una conversación con sus mensajes (optimizado para evitar timeouts)
 * OPTIMIZADO: Carga mensajes de forma eficiente evitando timeouts
 * @param {string} chatId - ID del chat
 * @param {number} batchSize - Tamaño de lote para cargar mensajes (default: 1000)
 * @returns {Promise<{conversation: Object, messages: Array, totalMessages: number}>}
 */
export async function getConversationWithMessages(chatId, batchSize = 10000) {
  // Primero contar total de mensajes en este chat
  const { count: totalMessages, error: countError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chatId)

  if (countError) {
    console.error('❌ Error al contar mensajes:', countError)
  }

  // Obtener información del chat
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select(`
      *,
      bot:bots(*),
      contact:contacts(*)
    `)
    .eq('id', chatId)
    .single()

  if (chatError) {
    console.error('❌ Error al obtener conversación:', chatError)
    return null
  }

  // Determinar nombre del contacto para la conversación
  let contactName = 'Sin nombre'
  if (chatData.contact?.name) {
    contactName = chatData.contact.name
  } else if (chatData.contact?.push_name) {
    contactName = chatData.contact.push_name
  } else if (chatData.name) {
    contactName = chatData.name
  } else if (chatData.contact_name) {
    contactName = chatData.contact_name
  } else if (chatData.contact_number) {
    contactName = chatData.contact_number
  } else if (chatData.chat_id) {
    contactName = chatData.chat_id.split('@')[0]
  }

  // Obtener mensajes de forma optimizada (sin media_files para evitar timeout)
  let allMessages = []
  let hasError = false

  try {
    // CONSULTA SIMPLIFICADA - Solo campos esenciales (SIN media_files para evitar timeout)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        body,
        content,
        type,
        from_me,
        timestamp,
        has_media,
        media_url,
        media_mimetype,
        metadata
      `)
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true })

    if (messagesError) {
      console.warn('⚠️ Error al obtener mensajes:', messagesError.message)
      hasError = true
    } else {
      allMessages = messages || []
    }
  } catch (error) {
    console.warn('⚠️ Error en consulta:', error)
    hasError = true
  }

  // Si hay error, intentar consulta más básica
  if (hasError || allMessages.length === 0) {
    try {
      const { data: basicMessages, error: basicError } = await supabase
        .from('messages')
        .select('id, body, content, from_me, timestamp, type')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true })
        .limit(batchSize) // Usar el mismo límite

      if (basicError) {
        console.error('❌ Error en consulta básica:', basicError.message)
        allMessages = []
      } else {
        allMessages = basicMessages || []
      }
    } catch (basicError) {
      console.error('❌ Error crítico:', basicError)
      allMessages = []
    }
  }

  // Estadísticas detalladas
  const incomingCount = allMessages.filter(m => !m.from_me).length
  const outgoingCount = allMessages.filter(m => m.from_me).length
  const mediaCount = allMessages.filter(m => m.has_media || m.media_url).length

  // Procesar mensajes para mejor visualización
  const processedMessages = allMessages.map(msg => ({
    ...msg,
    // Asegurar que el body no sea null/undefined
    body: msg.body || msg.content || '',
    // Formatear timestamp
    formatted_timestamp: new Date(msg.timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    // Indicar si tiene multimedia
    has_multimedia: !!(msg.has_media || msg.media_url),
    // Tipo de mensaje más descriptivo
    message_type_display: msg.from_me ? 'Enviado por Bot' : `Recibido de ${contactName}`
  }))

  return {
    conversation: {
      ...chatData,
      contact_name: contactName
    },
    messages: processedMessages,
    totalMessages: totalMessages || 0,
    loadedMessages: allMessages.length,
    isPartial: allMessages.length < (totalMessages || 0),
    stats: {
      incoming: incomingCount,
      outgoing: outgoingCount,
      media: mediaCount,
      total: allMessages.length
    }
  }
}

/**
 * Búsqueda global de chats/conversaciones
 * Busca por nombre de contacto, número de teléfono o palabras clave en mensajes
 * @param {string} searchQuery - Texto de búsqueda
 * @param {number} limit - Límite de resultados (default: 50)
 * @returns {Promise<Array>} Array de chats que coinciden con la búsqueda
 */
export async function globalSearchChats(searchQuery, limit = 50) {
  if (!searchQuery || searchQuery.trim() === '') {
    return []
  }

  const query = searchQuery.trim().toLowerCase()

  try {
    // Buscar en chats por nombre de contacto o número de teléfono
    // Excluir estados y canales de WhatsApp
    const { data: chatsData, error: chatsError } = await supabase
      .from('chats')
      .select(`
        *,
        bot:bots(id, session_name, phone_number, status),
        contact:contacts(id, name, phone_number, profile_picture_url)
      `)
      .or(`contact_name.ilike.%${query}%,contact_number.ilike.%${query}%,name.ilike.%${query}%,chat_id.ilike.%${query}%`)
      .not('chat_id', 'ilike', '%status%')
      .not('chat_id', 'ilike', '%@broadcast%')
      .limit(limit)

    if (chatsError) {
      console.error('❌ Error en búsqueda de chats:', chatsError)
    }

    // Buscar en contactos directamente
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        id,
        name,
        phone_number,
        profile_picture_url,
        bot_id
      `)
      .or(`name.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .limit(limit)

    if (contactsError) {
      console.error('❌ Error en búsqueda de contactos:', contactsError)
    }

    // Si encontramos contactos, buscar sus chats
    let chatsFromContacts = []
    if (contactsData && contactsData.length > 0) {
      const contactIds = contactsData.map(c => c.id)
      const { data: relatedChats } = await supabase
        .from('chats')
        .select(`
          *,
          bot:bots(id, session_name, phone_number, status),
          contact:contacts(id, name, phone_number, profile_picture_url)
        `)
        .in('contact_id', contactIds)

      chatsFromContacts = relatedChats || []
    }

    // Buscar en mensajes por contenido (palabra clave)
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        chat_id,
        body,
        timestamp
      `)
      .ilike('body', `%${query}%`)
      .order('timestamp', { ascending: false })
      .limit(100)

    if (messagesError) {
      console.error('❌ Error en búsqueda de mensajes:', messagesError)
    }

    // Crear un mapa de chat_id -> último mensaje que coincide
    const messageMatchMap = new Map()
    if (messagesData && messagesData.length > 0) {
      messagesData.forEach(message => {
        if (!messageMatchMap.has(message.chat_id)) {
          messageMatchMap.set(message.chat_id, {
            body: message.body,
            timestamp: message.timestamp
          })
        }
      })
    }

    // Si encontramos mensajes, obtener sus chats únicos
    let chatsFromMessages = []
    if (messagesData && messagesData.length > 0) {
      const uniqueChatIds = [...new Set(messagesData.map(m => m.chat_id))]
      const { data: relatedChats } = await supabase
        .from('chats')
        .select(`
          *,
          bot:bots(id, session_name, phone_number, status),
          contact:contacts(id, name, phone_number, profile_picture_url)
        `)
        .in('id', uniqueChatIds)
        .not('chat_id', 'ilike', '%status%')
        .not('chat_id', 'ilike', '%@broadcast%')

      chatsFromMessages = relatedChats || []
    }

    // Combinar todos los resultados y eliminar duplicados
    const allChats = [
      ...(chatsData || []),
      ...chatsFromContacts,
      ...chatsFromMessages
    ]

    // Eliminar duplicados por ID y agregar información de coincidencia
    const uniqueChatsMap = new Map()
    allChats.forEach(chat => {
      if (!uniqueChatsMap.has(chat.id)) {
        // Verificar si hay coincidencia en mensaje
        const messageMatch = messageMatchMap.get(chat.id)

        uniqueChatsMap.set(chat.id, {
          ...chat,
          contact_name: chat.contact?.name || chat.contact_name || chat.name || 'Sin nombre',
          contact_phone: chat.contact?.phone_number || chat.contact_number || chat.chat_id,
          contact_profile_picture_url: chat.contact?.profile_picture_url || null,
          bot_name: chat.bot?.session_name || 'Bot desconocido',
          // Agregar información de coincidencia en mensaje
          match_message: messageMatch ? messageMatch.body : null,
          match_timestamp: messageMatch ? messageMatch.timestamp : null
        })
      }
    })

    const results = Array.from(uniqueChatsMap.values())
    // console.log('✅ Resultados de búsqueda global:', results.length)

    // Ordenar por última actividad
    results.sort((a, b) => {
      const dateA = new Date(a.last_message_time || a.updated_at || a.created_at)
      const dateB = new Date(b.last_message_time || b.updated_at || b.created_at)
      return dateB - dateA
    })

    return results

  } catch (error) {
    console.error('❌ Error en búsqueda global:', error)
    return []
  }
}

/**
 * Descarga una conversación en formato TXT
 */
export function downloadConversationAsTxt(conversation) {
  const { contact, name, chat_id, messages } = conversation
  const contactIdentifier = contact?.name || name || chat_id

  let conversationText = `Conversación con ${contactIdentifier}\n`
  conversationText += `ID: ${chat_id}\n`
  conversationText += `Fecha: ${new Date().toLocaleString()}\n`
  conversationText += `Total de mensajes: ${messages?.length || 0}\n`
  conversationText += `\n${'='.repeat(60)}\n\n`

  if (messages && messages.length > 0) {
    messages.forEach(msg => {
      const sender = msg.from_me ? 'Bot' : contactIdentifier
      const formattedTimestamp = new Date(msg.timestamp).toLocaleString()
      conversationText += `[${formattedTimestamp}] ${sender}:\n${msg.body || ''}\n\n`
    })
  }

  const blob = new Blob([conversationText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `conversacion_${contactIdentifier}_${Date.now()}.txt`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Descarga una conversación en formato Markdown
 */
export function downloadConversationAsMarkdown(conversation) {
  const { contact, name, chat_id, messages, bot } = conversation
  const contactIdentifier = contact?.name || name || chat_id

  let markdown = `# Conversación con ${contactIdentifier}\n\n`
  markdown += `**Bot:** ${bot?.session_name || 'N/A'}\n`
  markdown += `**ID de WhatsApp:** \`${chat_id}\`\n`
  markdown += `**Fecha de descarga:** ${new Date().toLocaleString()}\n`
  markdown += `**Total de mensajes:** ${messages?.length || 0}\n\n`
  markdown += `---\n\n`

  if (messages && messages.length > 0) {
    messages.forEach(msg => {
      const sender = msg.from_me ? '🤖 **Bot**' : `👤 **${contactIdentifier}**`
      const formattedTimestamp = new Date(msg.timestamp).toLocaleString()
      markdown += `### ${sender}\n`
      markdown += `*${formattedTimestamp}*\n\n`
      markdown += `${msg.body || ''}\n\n`
      markdown += `---\n\n`
    })
  }

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `conversacion_${contactIdentifier}_${Date.now()}.md`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Obtiene el número de ventas concretadas basado en análisis de IA
 * @returns {Promise<number>} Número de ventas concretadas
 */
export async function getCompletedSalesCount() {
  try {
    // console.log('📊 Obteniendo ventas concretadas...')

    // Buscar chats que tengan análisis de IA con venta concretada
    const { data: chatsWithSales, error } = await supabase
      .from('chats')
      .select(`
        id,
        contact_name,
        contact_number,
        chat_id,
        bot:bots(session_name),
        last_message_time
      `)
      .not('ai_analysis', 'is', null)
      .eq('ai_analysis->sale_completed', true)
      .order('last_message_time', { ascending: false })

    if (error) {
      console.error('❌ Error obteniendo ventas concretadas:', error)
      return 0
    }

    // console.log(`✅ ${chatsWithSales?.length || 0} ventas concretadas encontradas`)
    return chatsWithSales?.length || 0
  } catch (error) {
    console.error('❌ Error en getCompletedSalesCount:', error)
    return 0
  }
}

/**
 * Obtiene la lista detallada de conversaciones con ventas concretadas
 * @param {number} limit - Límite de resultados (default: 100)
 * @returns {Promise<Array>} Array de conversaciones con ventas concretadas
 */
export async function getCompletedSalesConversations(limit = 100) {
  try {
    // console.log('📊 Obteniendo conversaciones con ventas concretadas...')

    const { data: salesConversations, error } = await supabase
      .from('chats')
      .select(`
        id,
        contact_name,
        contact_number,
        chat_id,
        last_message_time,
        ai_analysis,
        bot:bots(id, session_name, phone_number),
        contact:contacts(name, phone_number, profile_picture_url)
      `)
      .not('ai_analysis', 'is', null)
      .eq('ai_analysis->sale_completed', true)
      .order('last_message_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error obteniendo conversaciones con ventas:', error)
      return []
    }

    // Procesar y enriquecer los datos
    const processedConversations = (salesConversations || []).map(conv => {
      // Determinar nombre del contacto con múltiples fallbacks
      let displayName = 'Sin nombre'
      if (conv.contact?.name) {
        displayName = conv.contact.name
      } else if (conv.contact_name) {
        displayName = conv.contact_name
      } else if (conv.contact?.phone_number) {
        displayName = conv.contact.phone_number
      } else if (conv.contact_number) {
        displayName = conv.contact_number
      } else if (conv.chat_id) {
        displayName = conv.chat_id.split('@')[0]
      }

      // Determinar número de teléfono
      let displayPhone = 'Sin número'
      if (conv.contact?.phone_number) {
        displayPhone = conv.contact.phone_number
      } else if (conv.contact_number) {
        displayPhone = conv.contact_number
      } else if (conv.chat_id) {
        displayPhone = conv.chat_id.split('@')[0]
      }

      // Determinar asesor (del nombre de sesión del bot)
      let advisorName = 'Sin asesor'
      if (conv.bot?.session_name) {
        const sessionParts = conv.bot.session_name.split('_')
        // Buscar nombres comunes en la sesión
        const possibleNames = sessionParts.filter(part =>
          !['nova', 'apolo', 'flash', 'colombia', 'venezuela', 'moises', 'jesus', 'endry'].includes(part.toLowerCase())
        )
        if (possibleNames.length > 0) {
          advisorName = possibleNames[0].charAt(0).toUpperCase() + possibleNames[0].slice(1).toLowerCase()
        } else {
          advisorName = conv.bot.session_name
        }
      }

      return {
        ...conv,
        displayName,
        displayPhone,
        advisorName,
        formattedDate: conv.last_message_time
          ? new Date(conv.last_message_time).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          : 'Sin fecha'
      }
    })

    // console.log(`✅ ${processedConversations.length} conversaciones con ventas procesadas`)
    return processedConversations
  } catch (error) {
    console.error('❌ Error en getCompletedSalesConversations:', error)
    return []
  }
}
