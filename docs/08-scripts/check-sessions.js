import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const wahaClient = axios.create({
  baseURL: process.env.WAHA_BASE_URL,
  headers: {
    'X-Api-Key': process.env.WAHA_API_KEY,
    'Content-Type': 'application/json'
  }
});

async function checkSessions() {
  try {
    console.log('🔍 Verificando sesiones activas en WAHA...');
    console.log(`📡 WAHA URL: ${process.env.WAHA_BASE_URL}`);
    
    // Obtener todas las sesiones activas
    const response = await wahaClient.get('/api/sessions');
    const sessions = response.data;
    
    console.log(`\n✅ Sesiones encontradas: ${sessions.length}`);
    
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.name} - Estado: ${session.status}`);
    });
    
    console.log('\n🔍 Verificando chats de cada sesión...');
    
    for (const session of sessions) {
      try {
        const chatsResponse = await wahaClient.get(`/api/${session.name}/chats`, {
          params: { limit: 1000 }
        });
        console.log(`   ✅ ${session.name}: ${chatsResponse.data?.length || 0} chats`);
      } catch (error) {
        console.log(`   ❌ ${session.name}: Error ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error verificando sesiones:', error.response?.data || error.message);
  }
}

checkSessions();
