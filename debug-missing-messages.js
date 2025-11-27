import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugMissingMessages() {
  console.log('\n🔍 === DEBUG DE MENSAJES FALTANTES ===\n');

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

    // 2. Buscar el chat específico de la imagen: 51902387030
    console.log('\n2️⃣ Buscando chat específico: 51902387030');
    
    const { data: chatsFound, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .ilike('chat_id', '%51902387030%');

    let specificChat = null;
    if (chatError || !chatsFound || chatsFound.length === 0) {
      console.log('⚠️ No se encontró ese chat específico, buscando por contact_number...');
      
      const { data: chatsByContact } = await supabase
        .from('chats')
        .select('*')
        .ilike('contact_number', '%51902387030%');
      
      if (chatsByContact && chatsByContact.length > 0) {
        specificChat = chatsByContact[0];
        console.log('✅ Chat encontrado por contact_number');
      } else {
        console.log('⚠️ Usando cualquier chat de Abrahama...');
        
        const { data: abrahamaBot } = await supabase
          .from('bots')
          .select('id')
          .ilike('session_name', '%abrahama%')
          .single();

        if (abrahamaBot) {
          const { data: anyChat } = await supabase
            .from('chats')
            .select('*')
            .eq('bot_id', abrahamaBot.id)
            .limit(1)
            .single();
          
          if (anyChat) {
            specificChat = anyChat;
            console.log('✅ Usando chat alternativo de Abrahama:', specificChat.chat_id);
          }
        }
      }
    } else {
      specificChat = chatsFound[0];
      console.log('✅ Chat específico encontrado');
    }

    if (!specificChat) {
      console.error('❌ No se pudo encontrar ningún chat para analizar');
      return;
    }

    console.log('📋 Chat seleccionado:', {
      id: specificChat.id,
      chat_id: specificChat.chat_id,
      contact_name: specificChat.contact_name,
      contact_number: specificChat.contact_number
    });

    // 3. Obtener TODOS los mensajes RAW de este chat
    console.log('\n3️⃣ Obteniendo TODOS los mensajes RAW...');
    
    const { data: allMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', specificChat.id)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('❌ Error obteniendo mensajes:', messagesError.message);
      return;
    }

    console.log(`✅ ${allMessages.length} mensajes RAW encontrados`);

    // 4. Análisis detallado
    const entrantes = allMessages.filter(m => m.from_me === false);
    const salientes = allMessages.filter(m => m.from_me === true);
    const indefinidos = allMessages.filter(m => m.from_me === null || m.from_me === undefined);

    console.log('\n📊 ANÁLISIS DETALLADO:');
    console.log(`📨 ${entrantes.length} mensajes entrantes (from_me: false)`);
    console.log(`📤 ${salientes.length} mensajes salientes (from_me: true)`);
    console.log(`❓ ${indefinidos.length} mensajes indefinidos (from_me: null/undefined)`);

    // 5. Mostrar TODOS los mensajes con detalles completos
    console.log('\n📋 TODOS LOS MENSAJES RAW:');
    allMessages.forEach((msg, index) => {
      const direction = msg.from_me === true ? '📤 BOT' : 
                       msg.from_me === false ? '📨 CLIENTE' : 
                       '❓ INDEFINIDO';
      const timestamp = new Date(msg.timestamp).toLocaleString('es-ES');
      const body = msg.body || msg.content || '(sin texto)';
      
      console.log(`\n   ${index + 1}. ${direction} [${timestamp}]`);
      console.log(`      ID: ${msg.id}`);
      console.log(`      from_me: ${msg.from_me} (tipo: ${typeof msg.from_me})`);
      console.log(`      from_number: ${msg.from_number || 'N/A'}`);
      console.log(`      to_number: ${msg.to_number || 'N/A'}`);
      console.log(`      Texto: "${body.substring(0, 100)}${body.length > 100 ? '...' : ''}"`);
      console.log(`      Tipo: ${msg.type || 'N/A'}`);
    });

    // 6. Verificar si hay patrones problemáticos
    console.log('\n🔍 ANÁLISIS DE PATRONES:');
    
    const fromNumbers = [...new Set(allMessages.map(m => m.from_number).filter(Boolean))];
    const toNumbers = [...new Set(allMessages.map(m => m.to_number).filter(Boolean))];
    
    console.log('📞 Números únicos en from_number:', fromNumbers);
    console.log('📞 Números únicos en to_number:', toNumbers);
    
    // Verificar si from_me está correlacionado correctamente con los números
    console.log('\n🔗 CORRELACIÓN from_me vs números:');
    allMessages.forEach((msg, idx) => {
      if (msg.from_number && msg.to_number) {
        console.log(`   ${idx + 1}. from_me: ${msg.from_me} | from: ${msg.from_number} → to: ${msg.to_number}`);
      }
    });

    // 7. Simular la función getConversationWithMessages
    console.log('\n🧪 SIMULANDO getConversationWithMessages...');
    
    const processedMessages = allMessages.map(msg => ({
      ...msg,
      body: msg.body || msg.content || '',
      formatted_timestamp: new Date(msg.timestamp).toLocaleString('es-ES'),
      has_multimedia: !!(msg.has_media || msg.media_url),
      message_type_display: msg.from_me ? 'Enviado por Bot' : 'Recibido del Cliente'
    }));

    const finalEntrantes = processedMessages.filter(m => !m.from_me);
    const finalSalientes = processedMessages.filter(m => m.from_me);

    console.log(`📊 Después del procesamiento:`);
    console.log(`   📨 ${finalEntrantes.length} entrantes finales`);
    console.log(`   📤 ${finalSalientes.length} salientes finales`);

    // 8. Logout
    console.log('\n8️⃣ Cerrando sesión...');
    await supabase.auth.signOut();
    console.log('✅ Sesión cerrada');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar el debug
debugMissingMessages().then(() => {
  console.log('\n🏁 Debug de mensajes faltantes completado');
  console.log('\n💡 CONCLUSIONES:');
  console.log('   - Si hay mensajes entrantes en BD pero no se ven en UI = problema de renderizado');
  console.log('   - Si no hay mensajes entrantes en BD = problema de datos');
  console.log('   - Si from_me está mal = problema de lógica de negocio');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
