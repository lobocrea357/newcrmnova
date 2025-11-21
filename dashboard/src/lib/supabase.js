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
      
      // Contar chats (excluyendo estados y canales)
      const { count } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .eq('bot_id', bot.id)
        .not('chat_id', 'ilike', '%status%')
        .not('chat_id', 'ilike', '%@broadcast%')
        .not('chat_id', 'ilike', '%@newsletter%')
      
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
 * @param {string} botId - ID del bot
 * @param {number} page - Número de página (empezando en 1)
 * @param {number} pageSize - Cantidad de conversaciones por página (default: 10)
 * @returns {Promise<{data: Array, total: number, totalPages: number, currentPage: number}>}
 */
export async function getConversationsByBot(botId, page = 1, pageSize = 10) {
  console.log('🔍 Obteniendo conversaciones para bot:', botId, 'página:', page)
  
  // Primero obtener el total de conversaciones (excluyendo estados y canales)
  const { count: totalCount, error: countError } = await supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })
    .eq('bot_id', botId)
    .not('chat_id', 'ilike', '%status%')
    .not('chat_id', 'ilike', '%@broadcast%')
    .not('chat_id', 'ilike', '%@newsletter%')

  if (countError) {
    console.error('❌ Error al contar conversaciones:', countError)
    return { data: [], total: 0, totalPages: 0, currentPage: page }
  }

  const total = totalCount || 0
  const totalPages = Math.ceil(total / pageSize)

  // Calcular el rango para la paginación
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Obtener las conversaciones paginadas (excluyendo estados y canales)
  let query = supabase
    .from('chats')
    .select(`
      *,
      contact:contacts(id, name, phone_number, profile_picture_url)
    `)
    .eq('bot_id', botId)
    .not('chat_id', 'ilike', '%status%')
    .not('chat_id', 'ilike', '%@broadcast%')
    .not('chat_id', 'ilike', '%@newsletter%')
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error } = await query

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

      return {
        ...chat,
        message_count: count || 0,
        contact_name: chat.contact?.name || chat.name || 'Sin nombre',
        contact_phone: chat.contact?.phone_number || chat.chat_id,
        contact_profile_picture_url: chat.contact?.profile_picture_url || null
      }
    })
  )

  console.log('📊 Conversaciones con conteos:', chatsWithCounts)
  return {
    data: chatsWithCounts,
    total,
    totalPages,
    currentPage: page
  }
}

/**
 * Obtiene una conversación con sus mensajes paginados (estilo WhatsApp)
 * @param {string} chatId - ID del chat
 * @param {number} limit - Cantidad de mensajes a cargar (default: 50)
 * @param {string} beforeTimestamp - Timestamp para cargar mensajes anteriores (opcional)
 * @returns {Promise<{conversation: Object, messages: Array, hasMore: boolean, oldestTimestamp: string}>}
 */
export async function getConversationWithMessages(chatId, limit = 50, beforeTimestamp = null) {
  console.log('🔍 Obteniendo conversación:', chatId, 'limit:', limit, 'before:', beforeTimestamp)
  
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

  // Construir query para mensajes
  let messagesQuery = supabase
    .from('messages')
    .select(`
      *,
      media_files:media_files(*)
    `)
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: false }) // Descendente para obtener los más recientes primero
    .limit(limit + 1) // +1 para saber si hay más mensajes

  // Si hay beforeTimestamp, cargar mensajes anteriores a ese timestamp
  if (beforeTimestamp) {
    messagesQuery = messagesQuery.lt('timestamp', beforeTimestamp)
  }

  const { data: messages, error: messagesError } = await messagesQuery

  if (messagesError) {
    console.error('❌ Error al obtener mensajes:', messagesError)
    return {
      conversation: data,
      messages: [],
      hasMore: false,
      oldestTimestamp: null
    }
  }

  // Verificar si hay más mensajes
  const hasMore = messages && messages.length > limit
  const messagesToReturn = hasMore ? messages.slice(0, limit) : messages || []
  
  // Invertir el orden para mostrar del más antiguo al más reciente
  const sortedMessages = messagesToReturn.reverse()
  
  // Obtener el timestamp del mensaje más antiguo
  const oldestTimestamp = sortedMessages.length > 0 ? sortedMessages[0].timestamp : null

  console.log('✅ Mensajes obtenidos:', sortedMessages.length, 'hasMore:', hasMore)
  
  return {
    conversation: data,
    messages: sortedMessages,
    hasMore,
    oldestTimestamp
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
  console.log('🔍 Búsqueda global:', query)

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
      .not('chat_id', 'ilike', '%@newsletter%')
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
        .not('chat_id', 'ilike', '%@newsletter%')

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
    console.log('✅ Resultados de búsqueda global:', results.length)

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
