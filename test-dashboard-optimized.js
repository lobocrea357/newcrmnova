import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función optimizada para obtener conversaciones (copiada del dashboard)
async function getConversationsByBotOptimized(botId, page = 1, pageSize = 10) {
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
    .not('chat_id', 'ilike', '%status%')
    .not('chat_id', 'ilike', '%@broadcast%')
    .not('chat_id', 'ilike', '%@newsletter%')

  // Intentar ordenar por last_message_time, luego por updated_at, finalmente por created_at
  try {
    query = query.order('last_message_time', { ascending: false, nullsLast: true })
  } catch {
    try {
      query = query.order('updated_at', { ascending: false })
    } catch {
      query = query.order('created_at', { ascending: false })
    }
  }

  query = query.range(from, to)

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

  // Obtener conteo de mensajes y último mensaje para cada chat
  const chatsWithDetails = await Promise.all(
    data.map(async (chat) => {
      // Contar mensajes
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chat.id)

      // Obtener último mensaje
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('body, timestamp, from_me')
        .eq('chat_id', chat.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()

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

      return {
        ...chat,
        message_count: count || 0,
        contact_name: displayName,
        contact_phone: displayPhone,
        contact_profile_picture_url: chat.contact?.profile_picture_url || null,
        last_message_preview: lastMessage?.body?.substring(0, 100) || chat.last_message?.substring(0, 100) || '',
        last_message_timestamp: lastMessage?.timestamp || chat.last_message_time || chat.updated_at,
        last_message_from_me: lastMessage?.from_me || false,
        is_valid_contact: isValidContact
      }
    })
  )

  // Filtrar chats válidos y ordenar por última actividad
  const validChats = chatsWithDetails
    .filter(chat => chat.is_valid_contact)
    .sort((a, b) => {
      const dateA = new Date(a.last_message_timestamp || a.created_at)
      const dateB = new Date(b.last_message_timestamp || b.created_at)
      return dateB - dateA
    })

  console.log('📊 Conversaciones válidas procesadas:', validChats.length)
  console.log('📊 Conversaciones con mensajes:', validChats.filter(c => c.message_count > 0).length)

  return {
    data: validChats,
    total,
    totalPages,
    currentPage: page
  }
}

// Función optimizada para obtener mensajes completos
async function getConversationWithMessagesOptimized(chatId, maxLimit = 10000) {
  console.log('🔍 Obteniendo conversación completa:', chatId)

  // Primero contar total de mensajes en este chat
  const { count: totalMessages, error: countError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chatId)

  if (countError) {
    console.error('❌ Error al contar mensajes:', countError)
  } else {
    console.log(`📊 Total de mensajes en este chat: ${totalMessages || 0}`)
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

  // Obtener TODOS los mensajes (sin paginación)
  console.log(`📥 Cargando TODOS los ${totalMessages || 0} mensajes...`)
  
  const { data: allMessages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      *,
      media_files:media_files(*)
    `)
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: true })
    .limit(maxLimit)

  if (messagesError) {
    console.error('❌ Error al obtener mensajes:', messagesError)
    return {
      conversation: {
        ...chatData,
        contact_name: contactName
      },
      messages: [],
      totalMessages: totalMessages || 0
    }
  }

  const messages = allMessages || []
  
  // Estadísticas detalladas
  const incomingCount = messages.filter(m => !m.from_me).length
  const outgoingCount = messages.filter(m => m.from_me).length
  const mediaCount = messages.filter(m => m.has_media || m.media_url || (m.media_files && m.media_files.length > 0)).length
  
  console.log(`✅ TODOS los mensajes cargados: ${messages.length} total`)
  console.log(`   📨 ${incomingCount} entrantes (cliente → bot)`)
  console.log(`   📤 ${outgoingCount} salientes (bot → cliente)`)
  console.log(`   📎 ${mediaCount} con multimedia`)
  console.log(`   👤 Contacto: ${contactName}`)

  return {
    conversation: {
      ...chatData,
      contact_name: contactName
    },
    messages: messages,
    totalMessages: totalMessages || 0,
    stats: {
      incoming: incomingCount,
      outgoing: outgoingCount,
      media: mediaCount,
      total: messages.length
    }
  }
}

async function testDashboardOptimized() {
  console.log('\n🚀 === TEST DE DASHBOARD OPTIMIZADO ===\n');

  const adminEmail = 'admin@novapolointranet.xyz';
  const adminPassword = '2025.NoVapol0';

  try {
    // 1. Login como admin
    console.log('1️⃣ Autenticando como admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      return;
    }

    console.log('✅ Autenticado como:', authData.user.email);

    // 2. Obtener lista de bots
    console.log('\n2️⃣ Obteniendo lista de bots...');
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (botsError) {
      console.error('❌ Error obteniendo bots:', botsError.message);
      return;
    }

    console.log(`✅ ${bots.length} bots encontrados:`);
    bots.forEach((bot, index) => {
      console.log(`   ${index + 1}. ${bot.name} (${bot.session_name}) - Status: ${bot.status}`);
    });

    if (bots.length === 0) {
      console.log('⚠️ No hay bots disponibles para probar');
      return;
    }

    // 3. Probar conversaciones optimizadas del primer bot
    const testBot = bots[0];
    console.log(`\n3️⃣ Probando conversaciones optimizadas del bot: ${testBot.name}`);
    
    const conversationsResult = await getConversationsByBotOptimized(testBot.id, 1, 5);
    
    console.log(`\n📊 Resultado de conversaciones:`);
    console.log(`   Total: ${conversationsResult.total}`);
    console.log(`   Página actual: ${conversationsResult.currentPage}`);
    console.log(`   Total páginas: ${conversationsResult.totalPages}`);
    console.log(`   Conversaciones en esta página: ${conversationsResult.data.length}`);

    if (conversationsResult.data.length > 0) {
      console.log(`\n💬 Primeras conversaciones:`);
      conversationsResult.data.slice(0, 3).forEach((conv, index) => {
        console.log(`   ${index + 1}. ${conv.contact_name} (${conv.contact_phone})`);
        console.log(`      📨 ${conv.message_count} mensajes`);
        console.log(`      💬 Último: ${conv.last_message_preview}`);
        console.log(`      🕐 ${conv.last_message_timestamp ? new Date(conv.last_message_timestamp).toLocaleString() : 'Sin fecha'}`);
        console.log('');
      });

      // 4. Probar mensajes completos de la primera conversación
      const testConversation = conversationsResult.data[0];
      console.log(`\n4️⃣ Probando mensajes completos de: ${testConversation.contact_name}`);
      
      const messagesResult = await getConversationWithMessagesOptimized(testConversation.id);
      
      if (messagesResult) {
        console.log(`\n📊 Resultado de mensajes:`);
        console.log(`   Contacto: ${messagesResult.conversation.contact_name}`);
        console.log(`   Total mensajes: ${messagesResult.totalMessages}`);
        console.log(`   Mensajes cargados: ${messagesResult.messages.length}`);
        console.log(`   📨 Entrantes: ${messagesResult.stats.incoming}`);
        console.log(`   📤 Salientes: ${messagesResult.stats.outgoing}`);
        console.log(`   📎 Con multimedia: ${messagesResult.stats.media}`);

        if (messagesResult.messages.length > 0) {
          console.log(`\n💬 Primeros 3 mensajes:`);
          messagesResult.messages.slice(0, 3).forEach((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            const sender = msg.from_me ? '🤖 Bot' : `👤 ${messagesResult.conversation.contact_name}`;
            const content = (msg.body || '').substring(0, 80);
            console.log(`   ${index + 1}. [${timestamp}] ${sender}: ${content}${content.length >= 80 ? '...' : ''}`);
          });

          console.log(`\n💬 Últimos 3 mensajes:`);
          messagesResult.messages.slice(-3).forEach((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            const sender = msg.from_me ? '🤖 Bot' : `👤 ${messagesResult.conversation.contact_name}`;
            const content = (msg.body || '').substring(0, 80);
            console.log(`   ${index + 1}. [${timestamp}] ${sender}: ${content}${content.length >= 80 ? '...' : ''}`);
          });
        }
      }
    } else {
      console.log('⚠️ No se encontraron conversaciones para este bot');
    }

    // 5. Logout
    console.log('\n5️⃣ Cerrando sesión...');
    await supabase.auth.signOut();
    console.log('✅ Sesión cerrada');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar el test
testDashboardOptimized().then(() => {
  console.log('\n🏁 Test de dashboard optimizado completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
