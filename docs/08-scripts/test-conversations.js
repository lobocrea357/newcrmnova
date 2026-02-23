import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfklyrpftknzhpkzqeme.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNma2x5cnBmdGtuemhwa3pxZW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Mzc4MTcsImV4cCI6MjA3NTQxMzgxN30.0_G7YckI3cEYHMKSJo9Qd7tcMAv9ibw6whAFs78Fs5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConversations() {
  console.log('🔍 Probando función getConversationsByBot...\n');

  try {
    // 1. Obtener un bot para probar
    console.log('1. Obteniendo bots...');
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('*')
      .limit(3);

    if (botsError) {
      console.error('❌ Error obteniendo bots:', botsError);
      return;
    }

    if (!bots || bots.length === 0) {
      console.log('❌ No hay bots disponibles');
      return;
    }

    console.log(`✅ ${bots.length} bots encontrados`);
    
    // Buscar Jose Limongi o usar el primer bot
    let testBot = bots.find(bot => 
      bot.session_name && bot.session_name.toLowerCase().includes('limongi')
    ) || bots[0];

    console.log(`\n2. Probando con bot: ${testBot.session_name} (ID: ${testBot.id})`);

    // 2. Contar chats totales para este bot
    console.log('\n3. Contando chats totales...');
    const { count: totalCount, error: countError } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('bot_id', testBot.id);

    if (countError) {
      console.error('❌ Error contando chats:', countError);
      return;
    }

    console.log(`✅ Total de chats para este bot: ${totalCount}`);

    // 3. Contar chats excluyendo estados y canales
    console.log('\n4. Contando chats (excluyendo estados y canales)...');
    const { count: filteredCount, error: filteredError } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('bot_id', testBot.id)
      .not('chat_id', 'ilike', '%status%')
      .not('chat_id', 'ilike', '%@broadcast%')
      .not('chat_id', 'ilike', '%@newsletter%');

    if (filteredError) {
      console.error('❌ Error contando chats filtrados:', filteredError);
      return;
    }

    console.log(`✅ Chats filtrados: ${filteredCount}`);

    if (filteredCount === 0) {
      console.log('⚠️ No hay chats válidos para este bot después del filtrado');
      
      // Mostrar algunos chats para ver qué tipos hay
      console.log('\n5. Mostrando algunos chats para análisis...');
      const { data: sampleChats, error: sampleError } = await supabase
        .from('chats')
        .select('id, chat_id, bot_id')
        .eq('bot_id', testBot.id)
        .limit(5);

      if (sampleError) {
        console.error('❌ Error obteniendo muestra:', sampleError);
      } else {
        console.log('Muestra de chats:');
        sampleChats.forEach(chat => {
          console.log(`  - ID: ${chat.id}, Chat ID: ${chat.chat_id}`);
        });
      }
      return;
    }

    // 4. Probar la consulta completa con joins
    console.log('\n6. Probando consulta completa con joins...');
    
    try {
      const { data: chatsWithContacts, error: joinError } = await supabase
        .from('chats')
        .select(`
          *,
          contact:contacts(id, name, phone_number, profile_picture_url)
        `)
        .eq('bot_id', testBot.id)
        .not('chat_id', 'ilike', '%status%')
        .not('chat_id', 'ilike', '%@broadcast%')
        .not('chat_id', 'ilike', '%@newsletter%')
        .order('created_at', { ascending: false })
        .limit(5);

      if (joinError) {
        console.error('❌ Error en consulta con joins:', joinError);
        console.log('Detalles:', joinError.message);
        console.log('Código:', joinError.code);
        
        // Probar sin joins
        console.log('\n7. Probando sin joins...');
        const { data: chatsOnly, error: simpleError } = await supabase
          .from('chats')
          .select('*')
          .eq('bot_id', testBot.id)
          .not('chat_id', 'ilike', '%status%')
          .not('chat_id', 'ilike', '%@broadcast%')
          .not('chat_id', 'ilike', '%@newsletter%')
          .limit(5);

        if (simpleError) {
          console.error('❌ Error incluso sin joins:', simpleError);
        } else {
          console.log(`✅ Sin joins funciona: ${chatsOnly.length} chats`);
          if (chatsOnly.length > 0) {
            console.log('Primer chat:', chatsOnly[0]);
          }
        }
      } else {
        console.log(`✅ Consulta con joins exitosa: ${chatsWithContacts.length} chats`);
        if (chatsWithContacts.length > 0) {
          console.log('Primer chat con contacto:');
          console.log(JSON.stringify(chatsWithContacts[0], null, 2));
        }
      }
    } catch (err) {
      console.error('❌ Excepción en consulta:', err.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testConversations();
