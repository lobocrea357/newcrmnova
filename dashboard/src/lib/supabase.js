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
      
      return {
        worker_id: worker.id,
        worker_name: worker.name,
        worker_email: worker.email,
        worker_status: worker.status,
        total_bots: botCount || 0
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
  
  const { data: bots, error } = await supabase
    .from('bots')
    .select(`
      *,
      worker:workers(id, name, email),
      chats:chats(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error al obtener bots:', error)
    return []
  }
  
  console.log('📊 Bots obtenidos desde Supabase:', bots?.length || 0)
  
  return (bots || []).map(bot => ({
    ...bot,
    conversation_count: bot.chats?.[0]?.count || 0
  }))
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
 * Obtiene las conversaciones de un bot específico
 */
export async function getConversationsByBot(botId) {
  console.log('🔍 Obteniendo conversaciones para bot:', botId)
  
  // Primero intentar con last_message_time, si falla usar created_at
  let query = supabase
    .from('chats')
    .select(`
      *,
      contact:contacts(id, name, phone_number)
    `)
    .eq('bot_id', botId)

  // Intentar ordenar por last_message_time, si falla usar created_at
  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error al obtener conversaciones:', error)
    return []
  }

  console.log('✅ Conversaciones obtenidas:', data?.length || 0, data)

  if (!data || data.length === 0) {
    console.log('⚠️ No se encontraron conversaciones para este bot')
    return []
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
        contact_phone: chat.contact?.phone_number || chat.chat_id
      }
    })
  )

  console.log('📊 Conversaciones con conteos:', chatsWithCounts)
  return chatsWithCounts
}

/**
 * Obtiene una conversación con todos sus mensajes (incluyendo multimedia)
 */
export async function getConversationWithMessages(chatId) {
  console.log('🔍 Obteniendo conversación:', chatId)
  
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

  // Obtener mensajes con archivos multimedia
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      *,
      media_files:media_files(*)
    `)
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: true })

  if (messagesError) {
    console.error('❌ Error al obtener mensajes:', messagesError)
    data.messages = []
  } else {
    data.messages = messages || []
  }

  console.log('✅ Conversación obtenida:', data.messages.length, 'mensajes')
  
  return data
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
