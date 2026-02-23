import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WAHA_URL = process.env.WAHA_BASE_URL || 'https://waha.lobocrea.pro';
const WAHA_API_KEY = process.env.WAHA_API_KEY;

console.log('\n🔍 === PRUEBA DE CONEXIÓN CON WAHA REMOTO ===\n');
console.log(`🌐 URL: ${WAHA_URL}`);
console.log(`🔑 API Key: ${WAHA_API_KEY ? '✅ Configurada' : '❌ No encontrada'}`);

const wahaClient = axios.create({
  baseURL: WAHA_URL,
  headers: {
    'X-Api-Key': WAHA_API_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 segundos de timeout
});

async function testWahaConnection() {
  try {
    console.log('\n1️⃣ Probando conexión básica...');
    
    // Test 1: Health check
    try {
      const healthResponse = await wahaClient.get('/health');
      console.log('✅ Health check exitoso:', healthResponse.status);
    } catch (error) {
      console.log('⚠️ Health check falló, probando endpoint alternativo...');
    }

    // Test 2: Obtener sesiones
    console.log('\n2️⃣ Obteniendo sesiones...');
    const sessionsResponse = await wahaClient.get('/api/sessions');
    const sessions = sessionsResponse.data;
    
    console.log(`✅ ${sessions.length} sesiones encontradas:`);
    sessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.name} - Estado: ${session.status}`);
    });

    // Test 3: Obtener chats de la primera sesión activa
    const activeSessions = sessions.filter(s => s.status === 'WORKING');
    
    if (activeSessions.length > 0) {
      const testSession = activeSessions[0].name;
      console.log(`\n3️⃣ Probando chats de la sesión: ${testSession}`);
      
      try {
        const chatsResponse = await wahaClient.get(`/api/${testSession}/chats`, {
          params: { limit: 5 }
        });
        const chats = chatsResponse.data || [];
        
        console.log(`✅ ${chats.length} chats encontrados en ${testSession}:`);
        chats.slice(0, 3).forEach((chat, index) => {
          const chatId = chat.id?._serialized || chat.id;
          console.log(`   ${index + 1}. ${chatId}`);
        });

        // Test 4: Obtener mensajes del primer chat
        if (chats.length > 0) {
          const testChatId = chats[0].id?._serialized || chats[0].id;
          console.log(`\n4️⃣ Probando mensajes del chat: ${testChatId}`);
          
          try {
            const messagesResponse = await wahaClient.get('/api/messages', {
              params: {
                session: testSession,
                chatId: testChatId,
                limit: 3
              }
            });
            const messages = messagesResponse.data || [];
            
            console.log(`✅ ${messages.length} mensajes encontrados:`);
            messages.forEach((msg, index) => {
              console.log(`   ${index + 1}. ${msg.id} - FromMe: ${msg.fromMe} - "${(msg.body || '').substring(0, 30)}..."`);
            });
            
          } catch (error) {
            console.log(`⚠️ Error obteniendo mensajes: ${error.message}`);
          }
        }
        
      } catch (error) {
        console.log(`⚠️ Error obteniendo chats: ${error.message}`);
      }
    } else {
      console.log('⚠️ No hay sesiones activas para probar chats');
    }

    console.log('\n✅ === PRUEBA COMPLETADA ===');
    console.log('🎉 La conexión con WAHA remoto funciona correctamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Ejecutar sincronización desde el dashboard');
    console.log('   2. Verificar que los mensajes se sincronicen correctamente');
    
  } catch (error) {
    console.error('\n❌ === ERROR EN LA CONEXIÓN ===');
    console.error(`Tipo: ${error.code || 'Unknown'}`);
    console.error(`Mensaje: ${error.message}`);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
    
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verificar que waha.lobocrea.pro esté accesible');
    console.log('   2. Confirmar que el API_KEY sea correcto');
    console.log('   3. Revisar configuración de CORS en WAHA');
    console.log('   4. Verificar que el puerto esté abierto');
  }
}

// Ejecutar la prueba
testWahaConnection().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
