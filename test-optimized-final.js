import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función optimizada final (copiada del dashboard actualizado)
async function getConversationWithMessagesOptimized(chatId, batchSize = 1000) {
  console.log('🔍 Obteniendo conversación optimizada:', chatId)

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

  // Obtener mensajes de forma optimizada (sin media_files para evitar timeout)
  console.log(`📥 Cargando ${totalMessages || 0} mensajes de forma optimizada...`)
  
  let allMessages = []
  let hasError = false
  
  try {
    // Intentar cargar todos los mensajes sin joins complejos
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        message_id,
        from_number,
        to_number,
        body,
        content,
        type,
        from_me,
        timestamp,
        has_media,
        media_url,
        media_mimetype,
        caption,
        ack
      `)
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true })
      .limit(batchSize)

    if (messagesError) {
      console.warn('⚠️ Error al obtener mensajes optimizados:', messagesError.message)
      hasError = true
    } else {
      allMessages = messages || []
    }
  } catch (error) {
    console.warn('⚠️ Timeout en consulta optimizada, intentando consulta básica...')
    hasError = true
  }

  // Si hay error, intentar consulta más básica
  if (hasError || allMessages.length === 0) {
    console.log('🔄 Intentando consulta básica...')
    try {
      const { data: basicMessages, error: basicError } = await supabase
        .from('messages')
        .select('id, body, content, from_me, timestamp, type')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true })
        .limit(500) // Límite más conservador

      if (basicError) {
        console.error('❌ Error en consulta básica:', basicError.message)
        allMessages = []
      } else {
        allMessages = basicMessages || []
        console.log('✅ Consulta básica exitosa')
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
  
  console.log(`✅ Mensajes cargados: ${allMessages.length} de ${totalMessages || 0} total`)
  console.log(`   📨 ${incomingCount} entrantes (cliente → bot)`)
  console.log(`   📤 ${outgoingCount} salientes (bot → cliente)`)
  console.log(`   📎 ${mediaCount} con multimedia`)
  console.log(`   👤 Contacto: ${contactName}`)

  return {
    conversation: {
      ...chatData,
      contact_name: contactName
    },
    messages: allMessages,
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

async function testOptimizedFinal() {
  console.log('\n🚀 === TEST FINAL OPTIMIZADO ===\n');

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

    console.log(`✅ ${chats.length} chats encontrados`);

    if (chats.length > 0) {
      const testChat = chats[0];
      console.log(`\n3️⃣ Probando función optimizada con chat: ${testChat.contact_name || testChat.contact_number}`);
      
      const result = await getConversationWithMessagesOptimized(testChat.id);
      
      if (result) {
        console.log('\n📊 RESULTADO FINAL:');
        console.log(`   Contacto: ${result.conversation.contact_name}`);
        console.log(`   Total mensajes en DB: ${result.totalMessages}`);
        console.log(`   Mensajes cargados: ${result.loadedMessages}`);
        console.log(`   Es parcial: ${result.isPartial ? 'SÍ' : 'NO'}`);
        console.log(`   Estadísticas:`, result.stats);

        if (result.messages.length > 0) {
          console.log('\n💬 MENSAJES CARGADOS:');
          console.log(`   Primeros 3 mensajes:`);
          result.messages.slice(0, 3).forEach((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            const sender = msg.from_me ? '🤖 Bot' : `👤 ${result.conversation.contact_name}`;
            const content = (msg.body || '').substring(0, 60);
            console.log(`     ${index + 1}. [${timestamp}] ${sender}: ${content}${content.length >= 60 ? '...' : ''}`);
          });

          if (result.messages.length > 3) {
            console.log(`   ... (${result.messages.length - 6} mensajes intermedios) ...`);
            
            console.log(`   Últimos 3 mensajes:`);
            result.messages.slice(-3).forEach((msg, index) => {
              const timestamp = new Date(msg.timestamp).toLocaleString();
              const sender = msg.from_me ? '🤖 Bot' : `👤 ${result.conversation.contact_name}`;
              const content = (msg.body || '').substring(0, 60);
              console.log(`     ${index + 1}. [${timestamp}] ${sender}: ${content}${content.length >= 60 ? '...' : ''}`);
            });
          }

          console.log(`\n🎉 ¡ÉXITO! Se cargaron ${result.messages.length} mensajes de ${result.totalMessages} totales`);
          
          if (result.isPartial) {
            console.log(`⚠️ Carga parcial debido a limitaciones de timeout, pero ahora SÍ hay mensajes visibles`);
          } else {
            console.log(`✅ Carga completa de toda la conversación`);
          }
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
testOptimizedFinal().then(() => {
  console.log('\n🏁 Test final optimizado completado');
  console.log('\n📝 RESUMEN: La función optimizada debería cargar al menos algunos mensajes');
  console.log('   incluso si no puede cargar todos debido a timeouts de la base de datos.');
  console.log('   Esto significa que el dashboard ahora mostrará mensajes en lugar de');
  console.log('   "No hay mensajes en esta conversación".');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
