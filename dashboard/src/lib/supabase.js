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
  console.log('🔍 Obteniendo workers...')

  const { data: workers, error } = await supabase
    .from('workers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('❌ Error al obtener workers:', error)
    return []
  }

  console.log('👷 Workers obtenidos:', workers?.length || 0, workers)

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

  console.log('📊 Workers con estadísticas:', workersWithStats)
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

  console.log('✅ Sesión verificada:', session.user.email)

  // Primero obtener los bots
  const { data: bots, error } = await supabase
    .from('bots')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error al obtener bots:', error)
    return []
  }

  console.log('📊 Bots obtenidos desde Supabase:', bots?.length || 0, bots)

  // Obtener información adicional para cada bot
  const botsWithDetails = await Promise.all(
    (bots || []).map(async (bot) => {
      // Obtener worker
      let worker = null
      if (bot.worker_id) {
        const { data: workerData } = await supabase
          .from('workers')
          .select('id, name, email')
          .eq('id', bot.worker_id)
          .single()
        worker = workerData
      }

      // Contar chats
      const { count } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .eq('bot_id', bot.id)

      return {
        ...bot,
        worker,
        conversation_count: count || 0
      }
    })
  )

  console.log('📊 Bots con detalles:', botsWithDetails)
  return botsWithDetails
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

/**
 * Obtiene las conversaciones de un bot específico con paginación
 * MEJORADO: Maneja correctamente chats sin contact_id
 * @param {string} botId - ID del bot
 * @param {number} page - Número de página (empezando en 1)
 * @param {number} pageSize - Cantidad de conversaciones por página (default: 10)
 * @returns {Promise<{data: Array, total: number, totalPages: number, currentPage: number}>}
 */
export async function getConversationsByBot(botId, page = 1, pageSize = 10) {
  console.log('🔍 Obteniendo conversaciones para bot:', botId, 'página:', page)

  // Primero obtener el total de conversaciones
  const { count: totalCount, error: countError } = await supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })
    .eq('bot_id', botId)

  if (countError) {
    console.error('❌ Error al contar conversaciones:', countError)
    return { data: [], total: 0, totalPages: 0, currentPage: page }
  }

  const total = totalCount || 0
  const totalPages = Math.ceil(total / pageSize)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Obtener las conversaciones paginadas, priorizando last_message_time si existe
  let query = supabase
    .from('chats')
    .select(`
      *,
      contact:contacts(id, name, phone_number, push_name)
    `)
    .eq('bot_id', botId)
    .order('last_message_time', { ascending: false, nullsFirst: false })
    .range(from, to)

  // Si la ordenación falla (column not found), fallback a created_at
  let { data, error } = await query

  if (error) {
    console.warn('⚠️ last_message_time no disponible, usando created_at', error.message)
    const fallbackQuery = supabase
      .from('chats')
      .select(`
        *,
        contact:contacts(id, name, phone_number, push_name)
      `)
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })
      .range(from, to)

    const fallbackResult = await fallbackQuery
    data = fallbackResult.data
    error = fallbackResult.error
  }

  if (error) {
    console.error('❌ Error al obtener conversaciones:', error)
    return { data: [], total: 0, totalPages: 0, currentPage: page }
  }

  console.log('✅ Conversaciones obtenidas:', data?.length || 0, 'de', total, 'totales')

  if (!data || data.length === 0) {
    console.log('⚠️ No se encontraron conversaciones para esta página')
    return { data: [], total, totalPages, currentPage: page }
  }

  // Obtener conteo de mensajes para cada chat
  const chatsWithCounts = await Promise.all(
    data.map(async (chat) => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chat.id)

      // MEJORADO: Lógica inteligente para nombres con múltiples fallbacks
      let displayName = 'Sin nombre'
      let displayPhone = ''

      // Prioridad 1: Nombre del contacto relacionado
      if (chat.contact?.name) {
        displayName = chat.contact.name
        displayPhone = chat.contact.phone_number || ''
      }
      // Prioridad 2: Push name del contacto
      else if (chat.contact?.push_name) {
        displayName = chat.contact.push_name
        displayPhone = chat.contact.phone_number || ''
      }
      // Prioridad 3: Nombre del chat
      else if (chat.name) {
        displayName = chat.name
        displayPhone = chat.contact?.phone_number || chat.contact_number || ''
      }
      // Prioridad 4: Número de teléfono del contacto
      else if (chat.contact?.phone_number) {
        displayName = chat.contact.phone_number
        displayPhone = chat.contact.phone_number
      }
      // Prioridad 5: contact_number del chat
      else if (chat.contact_number) {
        displayName = chat.contact_number
        displayPhone = chat.contact_number
      }
      // Prioridad 6: Extraer de chat_id (formato: 123456789@c.us)
      else if (chat.chat_id) {
        const phoneFromChatId = chat.chat_id.split('@')[0]
        displayName = phoneFromChatId
        displayPhone = phoneFromChatId
      }

      // Logging para debugging
      if (displayName === 'Sin nombre' && count > 0) {
        console.warn(`⚠️ Chat ${chat.id} tiene ${count} mensajes pero no se pudo determinar nombre`, {
          contact_id: chat.contact_id,
          contact_name: chat.contact?.name,
          chat_name: chat.name,
          contact_number: chat.contact_number,
          chat_id: chat.chat_id
        })
      }

      return {
        ...chat,
        message_count: count || 0,
        contact_name: displayName,
        contact_phone: displayPhone
      }
    })
  )

  console.log('📊 Conversaciones con conteos:', chatsWithCounts.length)

  // Log de chats sin nombre para debugging
  const chatsWithoutName = chatsWithCounts.filter(c => c.contact_name === 'Sin nombre')
  if (chatsWithoutName.length > 0) {
    console.warn(`⚠️ ${chatsWithoutName.length} chats sin nombre en esta página`)
  }

  return {
    data: chatsWithCounts,
    total,
    totalPages,
    currentPage: page
  }
}

/**
 * Obtiene una conversación con sus mensajes paginados (estilo WhatsApp)
 * MEJORADO: Agrega logging detallado y retorna total de mensajes
 * @param {string} chatId - ID del chat
 * @param {number} limit - Cantidad de mensajes a cargar (default: 50)
 * @param {string} beforeTimestamp - Timestamp para cargar mensajes anteriores (opcional)
 * @returns {Promise<{conversation: Object, messages: Array, hasMore: boolean, oldestTimestamp: string, totalMessages: number}>}
 */
export async function getConversationWithMessages(chatId, limit = 50, beforeTimestamp = null) {
  console.log('🔍 Obteniendo conversación:', chatId, 'limit:', limit, 'before:', beforeTimestamp)

  // NUEVO: Primero contar total de mensajes en este chat
  const { count: totalMessages, error: countError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chatId)

  if (countError) {
    console.error('❌ Error al contar mensajes:', countError)
  } else {
    console.log(`📊 Total de mensajes en este chat: ${totalMessages || 0}`)
  }

  const { data, error } = await supabase
    .from('chats')
    .select(`
      *,
      bot:bots(*),
      contact:contacts(*)
    `)
    .eq('id', chatId)
    .single()

  if (error) {
    console.error('❌ Error al obtener conversación:', error)
    return null
  }

  // NUEVO: Advertir si hay muchos mensajes
  if (totalMessages > limit && !beforeTimestamp) {
    console.warn(`⚠️ Este chat tiene ${totalMessages} mensajes, pero solo se cargarán ${limit} inicialmente`)
    console.log(`💡 El usuario puede hacer scroll hacia arriba para cargar más mensajes`)
  }

  // Construir query para mensajes
  let messagesQuery = supabase
    .from('messages')
    .select(`
      *,
      media_files:media_files(*)
    `)
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: false })
    .limit(limit + 1)

  if (beforeTimestamp) {
    messagesQuery = messagesQuery.lt('timestamp', beforeTimestamp)
    console.log(`📅 Cargando mensajes anteriores a: ${beforeTimestamp}`)
  }

  const { data: messages, error: messagesError } = await messagesQuery

  if (messagesError) {
    console.error('❌ Error al obtener mensajes:', messagesError)
    return {
      conversation: data,
      messages: [],
      hasMore: false,
      oldestTimestamp: null,
      totalMessages: totalMessages || 0
    }
  }

  const hasMore = messages && messages.length > limit
  const messagesToReturn = hasMore ? messages.slice(0, limit) : messages || []
  const sortedMessages = messagesToReturn.reverse()
  const oldestTimestamp = sortedMessages.length > 0 ? sortedMessages[0].timestamp : null

  // NUEVO: Logging detallado
  const incomingCount = sortedMessages.filter(m => !m.from_me).length
  const outgoingCount = sortedMessages.filter(m => m.from_me).length

  console.log(`✅ Mensajes obtenidos: ${sortedMessages.length} total`)
  console.log(`   📨 ${incomingCount} entrantes (cliente → bot)`)
  console.log(`   📤 ${outgoingCount} salientes (bot → cliente)`)
  console.log(`   📊 Hay más mensajes: ${hasMore ? 'Sí' : 'No'}`)

  return {
    conversation: data,
    messages: sortedMessages,
    hasMore,
    oldestTimestamp,
    totalMessages: totalMessages || 0
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
