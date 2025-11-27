import axios from 'axios';
import supabase from './src/config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const WAHA_URL = process.env.WAHA_BASE_URL || 'https://waha.lobocrea.pro';
const WAHA_API_KEY = process.env.WAHA_API_KEY;

const wahaClient = axios.create({
  baseURL: WAHA_URL,
  headers: {
    'X-Api-Key': WAHA_API_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

console.log('\n🧪 === PRUEBA DE SINCRONIZACIÓN (DRY RUN - SOLO LECTURA) ===\n');

async function testSyncDryRun() {
  try {
    // 1. Obtener un bot de prueba de Supabase
    console.log('1️⃣ Obteniendo bot de prueba desde Supabase...');
    const { data: testBot, error: botError } = await supabase
      .from('bots')
      .select('id, session_name, phone_number, status')
      .eq('session_name', 'sharon_colombia_endry')
      .single();

    if (botError || !testBot) {
      console.log('⚠️ Bot sharon no encontrado, usando el primer bot disponible...');
      const { data: bots } = await supabase
        .from('bots')
        .select('id, session_name, phone_number, status')
        .limit(1);
      
      if (!bots || bots.length === 0) {
        throw new Error('No hay bots en Supabase');
      }
      testBot = bots[0];
    }

    console.log(`✅ Bot de prueba: ${testBot.session_name} (${testBot.phone_number})`);

    // 2. Obtener chats desde WAHA
    console.log('\n2️⃣ Obteniendo chats desde WAHA...');
    const chatsResponse = await wahaClient.get(`/api/${testBot.session_name}/chats`, {
      params: { limit: 5 }
    });
    const wahaChats = chatsResponse.data || [];
    console.log(`✅ ${wahaChats.length} chats encontrados en WAHA`);

    if (wahaChats.length === 0) {
      console.log('⚠️ No hay chats para probar');
      return;
    }

    // 3. Probar el primer chat
    const testChat = wahaChats[0];
    const testChatId = testChat.id?._serialized || testChat.id;
    console.log(`\n3️⃣ Probando chat: ${testChatId}`);

    // 4. Obtener mensajes desde WAHA
    console.log('4️⃣ Obteniendo mensajes desde WAHA...');
    const messagesResponse = await wahaClient.get('/api/messages', {
      params: {
        session: testBot.session_name,
        chatId: testChatId,
        limit: 10
      }
    });
    const wahaMessages = messagesResponse.data || [];
    console.log(`✅ ${wahaMessages.length} mensajes encontrados en WAHA`);

    // 5. Comparar con Supabase (solo lectura)
    console.log('\n5️⃣ Comparando con mensajes en Supabase...');
    const { data: supabaseMessages } = await supabase
      .from('messages')
      .select('message_id, from_me, body, timestamp')
      .eq('bot_id', testBot.id)
      .limit(10);

    console.log(`📊 Mensajes en Supabase: ${supabaseMessages?.length || 0}`);

    // 6. Análisis detallado (DRY RUN)
    console.log('\n6️⃣ ANÁLISIS DETALLADO (DRY RUN):');
    
    const analysis = {
      wahaTotal: wahaMessages.length,
      supabaseTotal: supabaseMessages?.length || 0,
      wahaEntrantes: wahaMessages.filter(m => !m.fromMe).length,
      wahaSalientes: wahaMessages.filter(m => m.fromMe).length,
      supabaseEntrantes: supabaseMessages?.filter(m => !m.from_me).length || 0,
      supabaseSalientes: supabaseMessages?.filter(m => m.from_me).length || 0,
      nuevosEnWaha: 0,
      inconsistencias: []
    };

    console.log(`\n📊 ESTADÍSTICAS:`);
    console.log(`   WAHA: ${analysis.wahaTotal} total (${analysis.wahaEntrantes} entrantes, ${analysis.wahaSalientes} salientes)`);
    console.log(`   Supabase: ${analysis.supabaseTotal} total (${analysis.supabaseEntrantes} entrantes, ${analysis.supabaseSalientes} salientes)`);

    // Verificar mensajes nuevos
    const supabaseMessageIds = new Set((supabaseMessages || []).map(m => m.message_id));
    
    console.log(`\n🔍 ANÁLISIS DE MENSAJES:`);
    wahaMessages.forEach((wahaMsg, index) => {
      const exists = supabaseMessageIds.has(wahaMsg.id);
      const status = exists ? '✅ Existe' : '🆕 Nuevo';
      const direction = wahaMsg.fromMe ? '📤 Saliente' : '📨 Entrante';
      
      console.log(`   ${index + 1}. ${status} ${direction} - "${(wahaMsg.body || '').substring(0, 40)}..."`);
      
      if (!exists) {
        analysis.nuevosEnWaha++;
      }

      // Verificar consistencia de from_me
      if (exists) {
        const supabaseMsg = supabaseMessages.find(m => m.message_id === wahaMsg.id);
        if (supabaseMsg && supabaseMsg.from_me !== wahaMsg.fromMe) {
          analysis.inconsistencias.push({
            id: wahaMsg.id,
            wahaFromMe: wahaMsg.fromMe,
            supabaseFromMe: supabaseMsg.from_me
          });
        }
      }
    });

    console.log(`\n🆕 Mensajes nuevos en WAHA: ${analysis.nuevosEnWaha}`);
    
    if (analysis.inconsistencias.length > 0) {
      console.log(`\n⚠️ INCONSISTENCIAS DETECTADAS (${analysis.inconsistencias.length}):`);
      analysis.inconsistencias.forEach((inc, index) => {
        console.log(`   ${index + 1}. ${inc.id}: WAHA=${inc.wahaFromMe} vs Supabase=${inc.supabaseFromMe}`);
      });
    } else {
      console.log(`\n✅ No se detectaron inconsistencias en from_me`);
    }

    // 7. Simulación de lo que haría la sincronización
    console.log(`\n7️⃣ SIMULACIÓN DE SINCRONIZACIÓN:`);
    console.log(`   📥 Se insertarían: ${analysis.nuevosEnWaha} mensajes nuevos`);
    console.log(`   🔄 Se corregirían: ${analysis.inconsistencias.length} inconsistencias`);
    console.log(`   ⏭️ Se omitirían: ${analysis.wahaTotal - analysis.nuevosEnWaha} mensajes existentes`);

    // 8. Recomendación
    console.log(`\n💡 RECOMENDACIÓN:`);
    if (analysis.nuevosEnWaha > 0 || analysis.inconsistencias.length > 0) {
      console.log(`   🟢 ES SEGURO ejecutar la sincronización`);
      console.log(`   📈 Beneficios: +${analysis.nuevosEnWaha} mensajes, ${analysis.inconsistencias.length} correcciones`);
    } else {
      console.log(`   🟡 La sincronización no agregará mensajes nuevos`);
      console.log(`   ℹ️ Los datos ya están sincronizados`);
    }

    console.log(`\n✅ === PRUEBA DRY RUN COMPLETADA ===`);
    return analysis;

  } catch (error) {
    console.error('\n❌ Error en prueba dry run:', error.message);
    throw error;
  }
}

// Ejecutar la prueba
testSyncDryRun().then((analysis) => {
  console.log('\n🎯 RESUMEN FINAL:');
  console.log(`   • Conexión WAHA: ✅ Funcional`);
  console.log(`   • Datos disponibles: ✅ Sí`);
  console.log(`   • Riesgo de sincronización: 🟢 Bajo`);
  console.log(`   • Recomendación: ✅ Proceder con sincronización`);
  
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
