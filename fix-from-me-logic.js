import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service key para updates

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFromMeLogic() {
  console.log('\n🔧 === CORRECCIÓN DE LÓGICA from_me ===\n');

  try {
    // 1. Obtener todos los bots con sus números
    console.log('1️⃣ Obteniendo bots y sus números...');
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('id, session_name, phone_number');

    if (botsError) {
      console.error('❌ Error obteniendo bots:', botsError.message);
      return;
    }

    console.log(`✅ ${bots.length} bots encontrados:`);
    bots.forEach(bot => {
      console.log(`   - ${bot.session_name}: ${bot.phone_number || 'Sin número'}`);
    });

    // 2. Para cada bot, corregir los mensajes
    for (const bot of bots) {
      console.log(`\n2️⃣ Procesando bot: ${bot.session_name}`);
      
      // Obtener todos los mensajes de este bot
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, from_number, to_number, from_me, body, bot_id')
        .eq('bot_id', bot.id);

      if (messagesError) {
        console.error(`❌ Error obteniendo mensajes del bot ${bot.session_name}:`, messagesError.message);
        continue;
      }

      console.log(`   📨 ${messages.length} mensajes encontrados`);

      // Analizar y corregir
      let corrected = 0;
      const updates = [];

      for (const message of messages) {
        let shouldBeFromMe = null;

        // Lógica 1: Si el bot tiene número de teléfono, usar eso
        if (bot.phone_number) {
          const botNumber = bot.phone_number.replace(/\D/g, ''); // Solo números
          const fromNumber = (message.from_number || '').replace(/\D/g, '');
          
          if (fromNumber === botNumber) {
            shouldBeFromMe = true;
          } else if (fromNumber && fromNumber !== botNumber) {
            shouldBeFromMe = false;
          }
        }

        // Lógica 2: Si no hay número del bot, usar patrones en el contenido
        if (shouldBeFromMe === null && message.body) {
          const body = message.body.toLowerCase();
          
          // Patrones típicos de mensajes del bot
          const botPatterns = [
            'hola', 'buenos días', 'buenas tardes', 'buenas noches',
            'soy asesor', 'te habla', 'viajesnova', 'agencia',
            'promoción', 'oferta', 'disponibilidad', 'precio',
            'gracias por contactarnos', 'en qué puedo ayudarte'
          ];

          // Patrones típicos de mensajes del cliente
          const clientPatterns = [
            'cuotas', 'precio', 'información', 'me interesa',
            'sí', 'no', 'ok', 'gracias', 'cuánto cuesta'
          ];

          const hasBotPattern = botPatterns.some(pattern => body.includes(pattern));
          const hasClientPattern = clientPatterns.some(pattern => body.includes(pattern));

          if (hasBotPattern && !hasClientPattern) {
            shouldBeFromMe = true;
          } else if (hasClientPattern && !hasBotPattern) {
            shouldBeFromMe = false;
          }
        }

        // Si determinamos que debe cambiar
        if (shouldBeFromMe !== null && shouldBeFromMe !== message.from_me) {
          updates.push({
            id: message.id,
            from_me: shouldBeFromMe
          });
          corrected++;
          
          console.log(`   🔄 Corrigiendo mensaje: "${message.body?.substring(0, 30)}..." from_me: ${message.from_me} → ${shouldBeFromMe}`);
        }
      }

      // Aplicar las correcciones
      if (updates.length > 0) {
        console.log(`   💾 Aplicando ${updates.length} correcciones...`);
        
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ from_me: update.from_me })
            .eq('id', update.id);

          if (updateError) {
            console.error(`   ❌ Error actualizando mensaje ${update.id}:`, updateError.message);
          }
        }
        
        console.log(`   ✅ ${updates.length} mensajes corregidos`);
      } else {
        console.log(`   ✅ No se necesitaron correcciones`);
      }
    }

    // 3. Verificar resultados
    console.log('\n3️⃣ Verificando resultados...');
    
    const { data: totalMessages } = await supabase
      .from('messages')
      .select('from_me')
      .not('from_me', 'is', null);

    if (totalMessages) {
      const entrantes = totalMessages.filter(m => !m.from_me).length;
      const salientes = totalMessages.filter(m => m.from_me).length;
      
      console.log(`📊 Estado final:`);
      console.log(`   📨 ${entrantes} mensajes entrantes (from_me: false)`);
      console.log(`   📤 ${salientes} mensajes salientes (from_me: true)`);
      console.log(`   📊 Total: ${totalMessages.length} mensajes`);
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar la corrección
fixFromMeLogic().then(() => {
  console.log('\n🏁 Corrección de lógica from_me completada');
  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('   1. Refresca el dashboard');
  console.log('   2. Abre las conversaciones problemáticas');
  console.log('   3. Verifica que ahora aparezcan TODOS los mensajes');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
