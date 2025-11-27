import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSpecificMessages() {
  console.log('\n💬 === TEST DE MENSAJES ESPECÍFICOS ===\n');

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

    // 2. Buscar el chat específico que vimos en la imagen
    console.log('\n2️⃣ Buscando chat específico: 651165863772790@c.us');
    
    const { data: chatsFound, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .ilike('chat_id', '%651165863772790%');

    if (chatError || !chatsFound || chatsFound.length === 0) {
      console.log('⚠️ No se encontró ese chat específico, buscando cualquier chat de Sharon...');
      
      // Buscar cualquier chat del bot de Sharon
      const { data: sharonBot } = await supabase
        .from('bots')
        .select('id')
        .ilike('session_name', '%sharon%')
        .single();

      if (sharonBot) {
        const { data: anyChat } = await supabase
          .from('chats')
          .select('*')
          .eq('bot_id', sharonBot.id)
          .limit(1)
          .single();
        
        if (anyChat) {
          var specificChat = anyChat;
          console.log('✅ Usando chat alternativo de Sharon:', specificChat.chat_id);
        } else {
          console.error('❌ No se encontró ningún chat de Sharon');
          return;
        }
      } else {
        console.error('❌ No se encontró el bot de Sharon');
        return;
      }
    } else {
      var specificChat = chatsFound[0];
      console.log('✅ Chat específico encontrado');
    }

    if (chatError) {
      console.error('❌ Error buscando chat:', chatError.message);
      return;
    }

    console.log('✅ Chat encontrado:', {
      id: specificChat.id,
      chat_id: specificChat.chat_id,
      contact_name: specificChat.contact_name,
      contact_number: specificChat.contact_number
    });

    // 3. Obtener TODOS los mensajes de este chat
    console.log('\n3️⃣ Obteniendo TODOS los mensajes del chat...');
    
    const { data: allMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', specificChat.id)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('❌ Error obteniendo mensajes:', messagesError.message);
      return;
    }

    console.log(`✅ ${allMessages.length} mensajes encontrados`);

    // 4. Analizar los mensajes
    const entrantes = allMessages.filter(m => !m.from_me);
    const salientes = allMessages.filter(m => m.from_me);

    console.log(`📨 ${entrantes.length} mensajes entrantes (cliente → bot)`);
    console.log(`📤 ${salientes.length} mensajes salientes (bot → cliente)`);

    // 5. Mostrar todos los mensajes con detalles
    console.log('\n📋 TODOS LOS MENSAJES:');
    allMessages.forEach((msg, index) => {
      const direction = msg.from_me ? '📤 BOT' : '📨 CLIENTE';
      const timestamp = new Date(msg.timestamp).toLocaleString('es-ES');
      const body = msg.body || msg.content || '(sin texto)';
      
      console.log(`   ${index + 1}. ${direction} [${timestamp}]`);
      console.log(`      Texto: "${body.substring(0, 100)}${body.length > 100 ? '...' : ''}"`);
      console.log(`      Tipo: ${msg.type || 'text'}`);
      console.log(`      from_me: ${msg.from_me}`);
      console.log('');
    });

    // 6. Verificar si hay problemas con from_me
    console.log('\n🔍 ANÁLISIS DE from_me:');
    const fromMeValues = [...new Set(allMessages.map(m => m.from_me))];
    console.log('Valores únicos de from_me:', fromMeValues);
    
    if (fromMeValues.length === 1 && fromMeValues[0] === false) {
      console.log('⚠️ PROBLEMA: Todos los mensajes tienen from_me = false');
      console.log('💡 Esto significa que no hay mensajes del bot registrados');
    } else if (fromMeValues.length === 1 && fromMeValues[0] === true) {
      console.log('⚠️ PROBLEMA: Todos los mensajes tienen from_me = true');
      console.log('💡 Esto significa que no hay mensajes del cliente registrados');
    } else {
      console.log('✅ Hay mensajes tanto del cliente como del bot');
    }

    // 7. Logout
    console.log('\n7️⃣ Cerrando sesión...');
    await supabase.auth.signOut();
    console.log('✅ Sesión cerrada');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar el test
testSpecificMessages().then(() => {
  console.log('\n🏁 Test de mensajes específicos completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
