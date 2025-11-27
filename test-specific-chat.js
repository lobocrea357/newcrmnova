import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función optimizada copiada del dashboard
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

async function testSpecificChat() {
  console.log('\n🎯 === TEST DE CHAT ESPECÍFICO ===\n');

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

    // 2. Buscar el chat específico que aparece en la imagen (3467480590)
    console.log('\n2️⃣ Buscando chat específico: 3467480590...');
    
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .or(`contact_number.eq.3467480590,chat_id.ilike.%3467480590%`)

    if (chatsError) {
      console.error('❌ Error buscando chat:', chatsError.message);
      return;
    }

    console.log(`✅ ${chats.length} chats encontrados:`);
    chats.forEach((chat, index) => {
      console.log(`   ${index + 1}. ID: ${chat.id}`);
      console.log(`      Contact Number: ${chat.contact_number}`);
      console.log(`      Chat ID: ${chat.chat_id}`);
      console.log(`      Contact Name: ${chat.contact_name}`);
      console.log('');
    });

    if (chats.length === 0) {
      console.log('⚠️ No se encontró el chat específico. Vamos a buscar cualquier chat con mensajes...');
      
      // Buscar cualquier chat que tenga mensajes
      const { data: anyChats, error: anyChatsError } = await supabase
        .from('chats')
        .select('id, contact_number, contact_name, chat_id')
        .limit(5)

      if (anyChatsError) {
        console.error('❌ Error buscando chats:', anyChatsError.message);
        return;
      }

      console.log(`✅ ${anyChats.length} chats de ejemplo:`);
      anyChats.forEach((chat, index) => {
        console.log(`   ${index + 1}. ID: ${chat.id} - ${chat.contact_name || chat.contact_number}`);
      });

      if (anyChats.length > 0) {
        const testChat = anyChats[0];
        console.log(`\n3️⃣ Probando con chat: ${testChat.contact_name || testChat.contact_number}`);
        
        const result = await getConversationWithMessagesOptimized(testChat.id);
        
        if (result) {
          console.log('\n📊 Resultado:');
          console.log(`   Contacto: ${result.conversation.contact_name}`);
          console.log(`   Total mensajes: ${result.totalMessages}`);
          console.log(`   Mensajes cargados: ${result.messages.length}`);
          console.log(`   Estadísticas:`, result.stats);
        }
      }
    } else {
      // Probar con el chat encontrado
      const testChat = chats[0];
      console.log(`\n3️⃣ Probando mensajes del chat: ${testChat.contact_name || testChat.contact_number}`);
      
      const result = await getConversationWithMessagesOptimized(testChat.id);
      
      if (result) {
        console.log('\n📊 Resultado:');
        console.log(`   Contacto: ${result.conversation.contact_name}`);
        console.log(`   Total mensajes: ${result.totalMessages}`);
        console.log(`   Mensajes cargados: ${result.messages.length}`);
        console.log(`   Estadísticas:`, result.stats);

        if (result.messages.length > 0) {
          console.log('\n💬 Primeros 3 mensajes:');
          result.messages.slice(0, 3).forEach((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            const sender = msg.from_me ? '🤖 Bot' : `👤 ${result.conversation.contact_name}`;
            const content = (msg.body || '').substring(0, 80);
            console.log(`   ${index + 1}. [${timestamp}] ${sender}: ${content}${content.length >= 80 ? '...' : ''}`);
          });
        }
      }
    }

    // 4. Logout
    console.log('\n4️⃣ Cerrando sesión...');
    await supabase.auth.signOut();
    console.log('✅ Sesión cerrada');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar el test
testSpecificChat().then(() => {
  console.log('\n🏁 Test de chat específico completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
