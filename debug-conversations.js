import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfklyrpftknzhpkzqeme.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNma2x5cnBmdGtuemhwa3pxZW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Mzc4MTcsImV4cCI6MjA3NTQxMzgxN30.0_G7YckI3cEYHMKSJo9Qd7tcMAv9ibw6whAFs78Fs5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugConversations() {
  console.log('🔍 Iniciando diagnóstico de conversaciones...\n');

  try {
    // 0. Verificar autenticación
    console.log('0. Verificando conexión a Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ No hay usuario autenticado, usando clave anónima');
    } else if (user) {
      console.log(`✅ Usuario autenticado: ${user.email}`);
    } else {
      console.log('⚠️ No hay usuario autenticado, usando clave anónima');
    }

    // 1. Obtener todos los bots
    console.log('\n1. Obteniendo bots...');
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('*')
      .order('created_at', { ascending: false });

    if (botsError) {
      console.error('❌ Error obteniendo bots:', botsError);
      return;
    }

    console.log(`✅ ${bots.length} bots encontrados`);
    
    // Buscar el bot de Sharon
    const sharonBot = bots.find(bot => 
      bot.session_name && bot.session_name.toLowerCase().includes('sharon')
    );

    if (!sharonBot) {
      console.log('❌ No se encontró bot de Sharon');
      console.log('Bots disponibles:');
      bots.forEach(bot => {
        console.log(`  - ${bot.session_name} (ID: ${bot.id})`);
      });
      return;
    }

    console.log(`\n2. Bot de Sharon encontrado:`);
    console.log(`   - ID: ${sharonBot.id}`);
    console.log(`   - Nombre: ${sharonBot.session_name}`);
    console.log(`   - Estado: ${sharonBot.status}`);

    // 2. Verificar chats directamente
    console.log('\n3. Verificando chats directamente...');
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('bot_id', sharonBot.id);

    if (chatsError) {
      console.error('❌ Error obteniendo chats:', chatsError);
      return;
    }

    console.log(`✅ ${chats.length} chats encontrados para Sharon`);

    if (chats.length > 0) {
      console.log('\n4. Primeros 5 chats:');
      chats.slice(0, 5).forEach((chat, index) => {
        console.log(`   ${index + 1}. ID: ${chat.id}, Chat ID: ${chat.chat_id}, Contact ID: ${chat.contact_id}`);
      });

      // 3. Probar la consulta con joins como en el código
      console.log('\n5. Probando consulta con joins...');
      const { data: chatsWithContacts, error: joinError } = await supabase
        .from('chats')
        .select(`
          *,
          contact:contacts(id, name, phone_number, push_name, profile_picture_url)
        `)
        .eq('bot_id', sharonBot.id)
        .not('chat_id', 'ilike', '%status%')
        .not('chat_id', 'ilike', '%@broadcast%')
        .not('chat_id', 'ilike', '%@newsletter%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (joinError) {
        console.error('❌ Error en consulta con joins:', joinError);
        console.log('Detalles del error:', joinError.message);
        console.log('Código del error:', joinError.code);
        
        // Probar sin el campo problemático
        console.log('\n6. Probando sin push_name...');
        const { data: chatsWithoutPushName, error: noPushError } = await supabase
          .from('chats')
          .select(`
            *,
            contact:contacts(id, name, phone_number, profile_picture_url)
          `)
          .eq('bot_id', sharonBot.id)
          .limit(5);

        if (noPushError) {
          console.error('❌ Error sin push_name:', noPushError);
        } else {
          console.log(`✅ ${chatsWithoutPushName.length} chats obtenidos sin push_name`);
        }
      } else {
        console.log(`✅ ${chatsWithContacts.length} chats obtenidos con joins`);
        if (chatsWithContacts.length > 0) {
          console.log('Primer chat con contacto:');
          console.log(JSON.stringify(chatsWithContacts[0], null, 2));
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugConversations();
