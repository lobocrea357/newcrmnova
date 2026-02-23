import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funciones copiadas del dashboard
async function getCompletedSalesCount() {
  try {
    console.log('📊 Obteniendo ventas concretadas...')
    
    // Buscar chats que tengan análisis de IA con venta concretada
    const { data: chatsWithSales, error } = await supabase
      .from('chats')
      .select(`
        id,
        contact_name,
        contact_number,
        chat_id,
        bot:bots(session_name),
        last_message_time
      `)
      .not('ai_analysis', 'is', null)
      .eq('ai_analysis->sale_completed', true)
      .order('last_message_time', { ascending: false })

    if (error) {
      console.error('❌ Error obteniendo ventas concretadas:', error)
      return 0
    }

    console.log(`✅ ${chatsWithSales?.length || 0} ventas concretadas encontradas`)
    return chatsWithSales?.length || 0
  } catch (error) {
    console.error('❌ Error en getCompletedSalesCount:', error)
    return 0
  }
}

async function getCompletedSalesConversations(limit = 100) {
  try {
    console.log('📊 Obteniendo conversaciones con ventas concretadas...')
    
    const { data: salesConversations, error } = await supabase
      .from('chats')
      .select(`
        id,
        contact_name,
        contact_number,
        chat_id,
        last_message_time,
        ai_analysis,
        bot:bots(id, session_name, phone_number),
        contact:contacts(name, phone_number, profile_picture_url)
      `)
      .not('ai_analysis', 'is', null)
      .eq('ai_analysis->sale_completed', true)
      .order('last_message_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error obteniendo conversaciones con ventas:', error)
      return []
    }

    // Procesar y enriquecer los datos
    const processedConversations = (salesConversations || []).map(conv => {
      // Determinar nombre del contacto con múltiples fallbacks
      let displayName = 'Sin nombre'
      if (conv.contact?.name) {
        displayName = conv.contact.name
      } else if (conv.contact_name) {
        displayName = conv.contact_name
      } else if (conv.contact?.phone_number) {
        displayName = conv.contact.phone_number
      } else if (conv.contact_number) {
        displayName = conv.contact_number
      } else if (conv.chat_id) {
        displayName = conv.chat_id.split('@')[0]
      }

      // Determinar asesor (del nombre de sesión del bot)
      let advisorName = 'Sin asesor'
      if (conv.bot?.session_name) {
        const sessionParts = conv.bot.session_name.split('_')
        // Buscar nombres comunes en la sesión
        const possibleNames = sessionParts.filter(part => 
          !['nova', 'apolo', 'flash', 'colombia', 'venezuela', 'moises', 'jesus', 'endry'].includes(part.toLowerCase())
        )
        if (possibleNames.length > 0) {
          advisorName = possibleNames[0].charAt(0).toUpperCase() + possibleNames[0].slice(1).toLowerCase()
        } else {
          advisorName = conv.bot.session_name
        }
      }

      return {
        ...conv,
        displayName,
        advisorName,
        formattedDate: conv.last_message_time 
          ? new Date(conv.last_message_time).toLocaleString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Sin fecha'
      }
    })

    console.log(`✅ ${processedConversations.length} conversaciones con ventas procesadas`)
    return processedConversations
  } catch (error) {
    console.error('❌ Error en getCompletedSalesConversations:', error)
    return []
  }
}

async function testSalesFunctions() {
  console.log('\n💰 === TEST DE FUNCIONES DE VENTAS ===\n');

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

    // 2. Probar función de conteo de ventas
    console.log('\n2️⃣ Probando conteo de ventas concretadas...');
    const salesCount = await getCompletedSalesCount();
    console.log(`📊 Total de ventas concretadas: ${salesCount}`);

    // 3. Probar función de listado de conversaciones con ventas
    console.log('\n3️⃣ Probando listado de conversaciones con ventas...');
    const salesConversations = await getCompletedSalesConversations(10);
    
    if (salesConversations.length > 0) {
      console.log(`\n💬 Primeras ${Math.min(5, salesConversations.length)} conversaciones con ventas:`);
      salesConversations.slice(0, 5).forEach((conv, index) => {
        console.log(`   ${index + 1}. ${conv.displayName} (${conv.advisorName})`);
        console.log(`      📅 ${conv.formattedDate}`);
        console.log(`      🤖 Bot: ${conv.bot?.session_name || 'N/A'}`);
        console.log(`      📊 Análisis: ${JSON.stringify(conv.ai_analysis, null, 2).substring(0, 100)}...`);
        console.log('');
      });
    } else {
      console.log('⚠️ No se encontraron conversaciones con ventas concretadas');
      console.log('💡 Esto puede significar que:');
      console.log('   - No hay conversaciones analizadas por IA aún');
      console.log('   - No hay ventas exitosas detectadas');
      console.log('   - El campo ai_analysis no existe en la tabla chats');
    }

    // 4. Verificar estructura de la tabla chats
    console.log('\n4️⃣ Verificando estructura de tabla chats...');
    const { data: sampleChats, error: chatsError } = await supabase
      .from('chats')
      .select('id, ai_analysis')
      .limit(5)

    if (chatsError) {
      console.error('❌ Error consultando chats:', chatsError.message);
    } else {
      console.log(`✅ ${sampleChats.length} chats de muestra:`);
      sampleChats.forEach((chat, index) => {
        console.log(`   ${index + 1}. Chat ${chat.id}: ${chat.ai_analysis ? 'Tiene análisis IA' : 'Sin análisis IA'}`);
      });
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
testSalesFunctions().then(() => {
  console.log('\n🏁 Test de funciones de ventas completado');
  console.log('\n📝 RESUMEN:');
  console.log('   - Si hay ventas concretadas, el KPI las mostrará');
  console.log('   - Al hacer click en el KPI, se abrirá un modal con el listado');
  console.log('   - Cada conversación del modal es clickeable para navegar al chat');
  console.log('   - Los asesores se extraen del nombre de sesión del bot');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
