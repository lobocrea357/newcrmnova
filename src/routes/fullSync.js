import express from 'express';
import fullSyncService from '../services/fullSyncService.js';
import supabase from '../config/supabase.js';
import wahaClient from '../config/waha.js';

const router = express.Router();

/**
 * POST /api/full-sync/:session/messages
 * Sincroniza TODOS los mensajes de TODOS los chats de una sesión
 */
router.post('/:session/messages', async (req, res) => {
  try {
    const { session } = req.params;
    const { limit = 100, includeMedia = true, transcribeAudio = true } = req.body;

    console.log(`\n🔄 Iniciando sincronización completa de mensajes: ${session}`);

    const result = await fullSyncService.syncAllMessages(session, {
      limit,
      includeMedia,
      transcribeAudio
    });

    res.json({
      success: true,
      message: 'Sincronización completa exitosa',
      data: result.stats
    });

  } catch (error) {
    console.error('Error en full-sync messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/full-sync/all-bots
 * Sincroniza TODOS los mensajes de TODOS los bots
 */
router.post('/all-bots', async (req, res) => {
  try {
    const { limit = 1000, includeMedia = true, transcribeAudio = true, fixFromMe = true } = req.body;

    console.log(`\n🚀 Iniciando sincronización MASIVA de todos los bots`);

    // Obtener todos los bots activos
    const { data: bots, error } = await supabase
      .from('bots')
      .select('id, session_name, status')
      .in('status', ['WORKING', 'STOPPED', 'FAILED']); // Incluir todos los estados

    if (error) throw error;

    console.log(`📊 Bots encontrados en BD: ${bots.length}`);

    // Configuración optimizada para WAHA remoto
    console.log(`🌐 Configurando sincronización para WAHA remoto: ${process.env.WAHA_BASE_URL}`);
    
    // Intentar obtener sesiones activas con timeout extendido para servidor remoto
    let activeSessions = [];
    let useSessionValidation = true;
    
    try {
      console.log(`📡 Obteniendo sesiones activas de WAHA remoto...`);
      const sessionsResponse = await wahaClient.get('/api/sessions', {
        timeout: 60000 // 1 minuto para obtener sesiones
      });
      activeSessions = sessionsResponse.data.map(s => s.name);
      console.log(`✅ Sesiones activas obtenidas: ${activeSessions.length}`);
    } catch (error) {
      console.log(`⚠️  No se pudieron obtener sesiones activas: ${error.message}`);
      console.log(`🔄 Continuando con todos los bots WORKING (sin validación de sesión)`);
      useSessionValidation = false;
    }
    
    // Filtrar bots según disponibilidad de validación de sesiones
    let validBots;
    if (useSessionValidation && activeSessions.length > 0) {
      validBots = bots.filter(bot => 
        bot.status === 'WORKING' && activeSessions.includes(bot.session_name)
      );
      console.log(`📊 Bots validados con sesiones activas: ${validBots.length}`);
    } else {
      validBots = bots.filter(bot => bot.status === 'WORKING');
      console.log(`📊 Bots WORKING (sin validación de sesión): ${validBots.length}`);
    }
    
    // Ajustar límite según si es servidor remoto
    const isRemoteServer = process.env.WAHA_BASE_URL && !process.env.WAHA_BASE_URL.includes('localhost');
    const maxBots = isRemoteServer ? 10 : 5; // Más bots para servidor remoto optimizado
    
    const botsToSync = validBots.slice(0, maxBots);
    if (botsToSync.length < validBots.length) {
      console.log(`⚠️  Limitando a ${botsToSync.length} bots por lote. Ejecuta nuevamente para sincronizar los ${validBots.length - botsToSync.length} restantes.`);
    }
    
    if (botsToSync.length === 0) {
      throw new Error('No hay bots disponibles para sincronizar. Verifica el estado de los bots y la conectividad con WAHA.');
    }

    const globalStats = {
      bots: 0,
      chats: 0,
      messages: 0,
      fixed: 0,
      media: 0,
      errors: 0,
      results: []
    };

    // Procesar cada bot válido (limitado)
    for (const bot of botsToSync) {
      try {
        console.log(`\n🤖 Sincronizando bot: ${bot.session_name}`);
        
        // Bot ya verificado como válido, proceder con sincronización
        console.log(`   ✅ Sesión ${bot.session_name} válida, iniciando sincronización...`);
        
        const result = await fullSyncService.syncAllMessages(bot.session_name, {
          limit,
          includeMedia,
          transcribeAudio
        });

        globalStats.bots++;
        globalStats.chats += result.stats.chats;
        globalStats.messages += result.stats.messages;
        globalStats.fixed += result.stats.fixed || 0;
        globalStats.media += result.stats.media;
        globalStats.errors += result.stats.errors;

        globalStats.results.push({
          bot: bot.session_name,
          success: true,
          stats: result.stats
        });

        // Pausa entre bots (optimizada para servidor remoto)
        const isRemoteServer = process.env.WAHA_BASE_URL && !process.env.WAHA_BASE_URL.includes('localhost');
        const botPauseTime = isRemoteServer ? 2000 : 1000; // Pausa más larga para servidor remoto
        await new Promise(resolve => setTimeout(resolve, botPauseTime));

      } catch (error) {
        console.error(`❌ Error sincronizando bot ${bot.session_name}:`, error.message);
        globalStats.errors++;
        
        // Clasificar el tipo de error
        let errorType = 'unknown';
        if (error.message.includes('timeout')) {
          errorType = 'timeout';
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          errorType = 'session_not_found';
        } else if (error.message.includes('502') || error.message.includes('503')) {
          errorType = 'server_error';
        }
        
        globalStats.results.push({
          bot: bot.session_name,
          success: false,
          error: error.message,
          errorType: errorType
        });
        
        // Continuar con el siguiente bot en lugar de fallar completamente
        console.log(`🔄 Continuando con el siguiente bot...`);
      }
    }

    // CORRECCIÓN DE FROM_ME si está habilitada
    if (fixFromMe) {
      console.log(`\n🔧 Iniciando corrección de from_me para todos los mensajes...`);
      
      try {
        // Obtener todos los bots con su número de teléfono
        const { data: allBots } = await supabase
          .from('bots')
          .select('id, session_name, phone_number');

        let fixedCount = 0;

        for (const bot of allBots) {
          if (!bot.phone_number) continue;

          console.log(`🔧 Corrigiendo from_me para bot: ${bot.session_name} (${bot.phone_number})`);

          // Corregir mensajes donde from_me está mal
          // Si from_number == bot.phone_number entonces from_me = true
          // Si to_number == bot.phone_number entonces from_me = false
          
          const { data: updated1 } = await supabase
            .from('messages')
            .update({ from_me: true })
            .eq('from_number', bot.phone_number)
            .neq('from_me', true)
            .select('id');

          const { data: updated2 } = await supabase
            .from('messages')
            .update({ from_me: false })
            .eq('to_number', bot.phone_number)
            .neq('from_me', false)
            .select('id');

          const botFixed = (updated1?.length || 0) + (updated2?.length || 0);
          fixedCount += botFixed;
          
          if (botFixed > 0) {
            console.log(`   ✅ Corregidos ${botFixed} mensajes para ${bot.session_name}`);
          }
        }

        globalStats.fixed = fixedCount;
        console.log(`✅ Corrección completada: ${fixedCount} mensajes corregidos`);

      } catch (fixError) {
        console.error('❌ Error corrigiendo from_me:', fixError.message);
        globalStats.errors++;
      }
    }

    res.json({
      success: true,
      message: 'Sincronización masiva completada',
      data: globalStats
    });

  } catch (error) {
    console.error('Error en full-sync all-bots:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/full-sync/:session/chat/:chatId
 * Sincroniza mensajes de un chat específico
 */
router.post('/:session/chat/:chatId', async (req, res) => {
  try {
    const { session, chatId } = req.params;
    const { limit = 100, includeMedia = true, transcribeAudio = true } = req.body;

    console.log(`\n🔄 Sincronizando chat específico: ${chatId}`);

    const stats = await fullSyncService.syncChatMessages(session, chatId, {
      limit,
      includeMedia,
      transcribeAudio
    });

    res.json({
      success: true,
      message: 'Chat sincronizado exitosamente',
      data: stats
    });

  } catch (error) {
    console.error('Error en full-sync chat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
