import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFromMeByPhone() {
  console.log('\n📞 === CORRECCIÓN from_me POR NÚMERO DE TELÉFONO ===\n');

  try {
    // 1. Obtener todos los bots con sus números
    console.log('1️⃣ Obteniendo bots y sus números...');
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('id, session_name, phone_number')
      .not('phone_number', 'is', null);

    if (botsError) {
      console.error('❌ Error obteniendo bots:', botsError.message);
      return;
    }

    console.log(`✅ ${bots.length} bots con número encontrados:`);
    bots.forEach(bot => {
      console.log(`   - ${bot.session_name}: ${bot.phone_number}`);
    });

    // 2. Para cada bot, corregir mensajes basándose SOLO en números
    let totalCorrected = 0;

    for (const bot of bots) {
      console.log(`\n2️⃣ Procesando bot: ${bot.session_name} (${bot.phone_number})`);
      
      // Obtener chats de este bot
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id, chat_id, contact_number')
        .eq('bot_id', bot.id);

      if (chatsError) {
        console.error(`❌ Error obteniendo chats:`, chatsError.message);
        continue;
      }

      console.log(`   📁 ${chats.length} chats encontrados`);

      for (const chat of chats) {
        // Obtener mensajes de este chat
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id, from_number, to_number, from_me, body')
          .eq('chat_id', chat.id);

        if (messagesError) {
          console.error(`❌ Error obteniendo mensajes del chat ${chat.chat_id}:`, messagesError.message);
          continue;
        }

        if (messages.length === 0) continue;

        console.log(`     💬 Chat ${chat.chat_id}: ${messages.length} mensajes`);

        // Normalizar números (solo dígitos)
        const botNumber = bot.phone_number.replace(/\D/g, '');
        const contactNumber = (chat.contact_number || '').replace(/\D/g, '');

        let correctedInChat = 0;

        for (const message of messages) {
          const fromNumber = (message.from_number || '').replace(/\D/g, '');
          const toNumber = (message.to_number || '').replace(/\D/g, '');

          let correctFromMe = null;

          // Lógica basada en números
          if (fromNumber === botNumber) {
            correctFromMe = true; // Mensaje del bot
          } else if (fromNumber === contactNumber || (fromNumber && fromNumber !== botNumber)) {
            correctFromMe = false; // Mensaje del cliente
          } else if (toNumber === botNumber) {
            correctFromMe = false; // Mensaje dirigido al bot (del cliente)
          } else if (toNumber === contactNumber) {
            correctFromMe = true; // Mensaje dirigido al cliente (del bot)
          }

          // Si determinamos el valor correcto y es diferente al actual
          if (correctFromMe !== null && correctFromMe !== message.from_me) {
            const { error: updateError } = await supabase
              .from('messages')
              .update({ from_me: correctFromMe })
              .eq('id', message.id);

            if (updateError) {
              console.error(`❌ Error actualizando mensaje:`, updateError.message);
            } else {
              correctedInChat++;
              totalCorrected++;
              
              const direction = correctFromMe ? '📤 BOT' : '📨 CLIENTE';
              console.log(`       🔄 ${direction}: "${(message.body || '').substring(0, 30)}..."`);
            }
          }
        }

        if (correctedInChat > 0) {
          console.log(`     ✅ ${correctedInChat} mensajes corregidos en este chat`);
        }
      }
    }

    // 3. Verificar resultados finales
    console.log('\n3️⃣ Verificando resultados finales...');
    
    const { data: allMessages } = await supabase
      .from('messages')
      .select('from_me, bot_id')
      .not('from_me', 'is', null);

    if (allMessages) {
      const entrantes = allMessages.filter(m => !m.from_me).length;
      const salientes = allMessages.filter(m => m.from_me).length;
      
      console.log(`📊 Estado final global:`);
      console.log(`   📨 ${entrantes} mensajes entrantes (from_me: false)`);
      console.log(`   📤 ${salientes} mensajes salientes (from_me: true)`);
      console.log(`   🔄 ${totalCorrected} mensajes corregidos en total`);

      // Por bot
      for (const bot of bots) {
        const botMessages = allMessages.filter(m => m.bot_id === bot.id);
        const botEntrantes = botMessages.filter(m => !m.from_me).length;
        const botSalientes = botMessages.filter(m => m.from_me).length;
        
        console.log(`   📱 ${bot.session_name}: ${botEntrantes} entrantes, ${botSalientes} salientes`);
      }
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar la corrección
fixFromMeByPhone().then(() => {
  console.log('\n🏁 Corrección por número de teléfono completada');
  console.log('\n💡 AHORA DEBERÍAS VER:');
  console.log('   📨 Mensajes entrantes (blancos) del cliente');
  console.log('   📤 Mensajes salientes (azules) del bot');
  console.log('   🔄 Refresca el dashboard para ver los cambios');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
