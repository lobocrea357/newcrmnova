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
 * OPTIMIZADO: Sincroniza TODOS los mensajes de TODOS los bots
 * - Sin límite artificial de bots
 * - Procesamiento más eficiente
 * - Mejor manejo de errores
 */
router.post('/all-bots', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { limit = 500, includeMedia = true, transcribeAudio = true } = req.body;

    console.log(`\n🚀 ========== SINCRONIZACIÓN MASIVA OPTIMIZADA ==========`);

    // 1. Obtener todos los bots
    const { data: bots, error } = await supabase
      .from('bots')
      .select('id, session_name, status, phone_number')
      .in('status', ['WORKING', 'STOPPED', 'FAILED']);

    if (error) throw error;

    console.log(`📊 Bots en BD: ${bots.length}`);

    // 2. Obtener sesiones activas de WAHA (una sola llamada)
    let activeSessions = [];
    try {
      const sessionsResponse = await wahaClient.get('/api/sessions', { timeout: 30000 });
      activeSessions = (sessionsResponse.data || [])
        .filter(s => s.status === 'WORKING')
        .map(s => s.name);
      console.log(`✅ Sesiones WORKING en WAHA: ${activeSessions.length}`);
    } catch (wahaError) {
      console.log(`⚠️ No se pudo conectar a WAHA: ${wahaError.message}`);
      // Continuar con bots WORKING de la BD
    }

    // 3. Filtrar bots válidos (WORKING y con sesión activa en WAHA)
    let validBots;
    if (activeSessions.length > 0) {
      validBots = bots.filter(bot => 
        bot.status === 'WORKING' && activeSessions.includes(bot.session_name)
      );
    } else {
      validBots = bots.filter(bot => bot.status === 'WORKING');
    }

    console.log(`📊 Bots a sincronizar: ${validBots.length}`);

    if (validBots.length === 0) {
      return res.json({
        success: true,
        message: 'No hay bots activos para sincronizar',
        data: { bots: 0, chats: 0, messages: 0, skipped: 0, errors: 0 }
      });
    }

    const globalStats = {
      bots: 0,
      chats: 0,
      messages: 0,
      updated: 0,
      skipped: 0,
      media: 0,
      errors: 0,
      duration: 0,
      results: []
    };

    // 4. Procesar TODOS los bots (sin límite artificial)
    for (const bot of validBots) {
      const botStartTime = Date.now();
      
      try {
        console.log(`\n🤖 [${globalStats.bots + 1}/${validBots.length}] ${bot.session_name}`);
        
        const result = await fullSyncService.syncAllMessages(bot.session_name, {
          limit,
          includeMedia,
          transcribeAudio
        });

        globalStats.bots++;
        globalStats.chats += result.stats?.chats || 0;
        globalStats.messages += result.stats?.messages || 0;
        globalStats.updated += result.stats?.updated || 0;
        globalStats.skipped += result.stats?.skipped || 0;
        globalStats.media += result.stats?.media || 0;
        globalStats.errors += result.stats?.errors || 0;

        const botDuration = ((Date.now() - botStartTime) / 1000).toFixed(1);
        
        globalStats.results.push({
          bot: bot.session_name,
          success: true,
          duration: botDuration,
          stats: result.stats
        });

        console.log(`   ✅ Completado en ${botDuration}s`);

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        globalStats.errors++;
        
        globalStats.results.push({
          bot: bot.session_name,
          success: false,
          error: error.message
        });
        
        // Continuar con el siguiente bot
      }
    }

    // Calcular duración total
    globalStats.duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ ========== SINCRONIZACIÓN COMPLETADA ==========`);
    console.log(`   Duración total: ${globalStats.duration}s`);
    console.log(`   Bots: ${globalStats.bots}/${validBots.length}`);
    console.log(`   Chats: ${globalStats.chats}`);
    console.log(`   Mensajes nuevos: ${globalStats.messages}`);
    console.log(`   Mensajes actualizados: ${globalStats.updated}`);
    console.log(`   Mensajes sin cambios: ${globalStats.skipped}`);
    console.log(`   Media: ${globalStats.media}`);
    console.log(`   Errores: ${globalStats.errors}`);

    res.json({
      success: true,
      message: `Sincronización completada en ${globalStats.duration}s`,
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
 * POST /api/full-sync/selected-bots
 * Sincroniza bots seleccionados (máximo 3) para optimizar recursos
 * Body: { botSessionNames: string[], limit?: number, includeMedia?: boolean, transcribeAudio?: boolean }
 */
router.post('/selected-bots', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      botSessionNames = [], 
      limit = 500, 
      includeMedia = true, 
      transcribeAudio = true 
    } = req.body;

    // Validar que se enviaron bots
    if (!Array.isArray(botSessionNames) || botSessionNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debes seleccionar al menos 1 bot para sincronizar'
      });
    }

    // Limitar a máximo 3 bots
    if (botSessionNames.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Solo puedes sincronizar un máximo de 3 bots a la vez'
      });
    }

    console.log(`\n🚀 ========== SINCRONIZACIÓN SELECTIVA ==========`);
    console.log(`📊 Bots solicitados: ${botSessionNames.join(', ')}`);

    // Obtener los bots seleccionados de la BD
    const { data: bots, error } = await supabase
      .from('bots')
      .select('id, session_name, status, phone_number')
      .in('session_name', botSessionNames);

    if (error) throw error;

    if (!bots || bots.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron los bots especificados'
      });
    }

    console.log(`✅ Bots encontrados en BD: ${bots.length}`);

    // Verificar sesiones activas en WAHA
    let activeSessions = [];
    try {
      const sessionsResponse = await wahaClient.get('/api/sessions', { timeout: 30000 });
      activeSessions = (sessionsResponse.data || [])
        .filter(s => s.status === 'WORKING')
        .map(s => s.name);
      console.log(`✅ Sesiones WORKING en WAHA: ${activeSessions.length}`);
    } catch (wahaError) {
      console.log(`⚠️ No se pudo conectar a WAHA: ${wahaError.message}`);
    }

    // Filtrar bots válidos
    let validBots;
    if (activeSessions.length > 0) {
      validBots = bots.filter(bot => 
        bot.status === 'WORKING' && activeSessions.includes(bot.session_name)
      );
    } else {
      validBots = bots.filter(bot => bot.status === 'WORKING');
    }

    // Identificar bots que no están activos
    const inactiveBots = bots.filter(bot => 
      !validBots.some(vb => vb.session_name === bot.session_name)
    );

    if (validBots.length === 0) {
      return res.json({
        success: false,
        error: 'Ninguno de los bots seleccionados está activo (WORKING)',
        inactiveBots: inactiveBots.map(b => ({
          name: b.session_name,
          status: b.status
        }))
      });
    }

    console.log(`📊 Bots a sincronizar: ${validBots.length}`);
    if (inactiveBots.length > 0) {
      console.log(`⚠️ Bots inactivos omitidos: ${inactiveBots.map(b => b.session_name).join(', ')}`);
    }

    const globalStats = {
      bots: 0,
      chats: 0,
      messages: 0,
      updated: 0,
      skipped: 0,
      media: 0,
      errors: 0,
      duration: 0,
      results: [],
      inactiveBots: inactiveBots.map(b => ({
        name: b.session_name,
        status: b.status
      }))
    };

    // Procesar los bots seleccionados
    for (const bot of validBots) {
      const botStartTime = Date.now();
      
      try {
        console.log(`\n🤖 [${globalStats.bots + 1}/${validBots.length}] ${bot.session_name}`);
        
        const result = await fullSyncService.syncAllMessages(bot.session_name, {
          limit,
          includeMedia,
          transcribeAudio
        });

        globalStats.bots++;
        globalStats.chats += result.stats?.chats || 0;
        globalStats.messages += result.stats?.messages || 0;
        globalStats.updated += result.stats?.updated || 0;
        globalStats.skipped += result.stats?.skipped || 0;
        globalStats.media += result.stats?.media || 0;
        globalStats.errors += result.stats?.errors || 0;

        const botDuration = ((Date.now() - botStartTime) / 1000).toFixed(1);
        
        globalStats.results.push({
          bot: bot.session_name,
          success: true,
          duration: botDuration,
          stats: result.stats
        });

        console.log(`   ✅ Completado en ${botDuration}s`);

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        globalStats.errors++;
        
        globalStats.results.push({
          bot: bot.session_name,
          success: false,
          error: error.message
        });
      }
    }

    globalStats.duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ ========== SINCRONIZACIÓN SELECTIVA COMPLETADA ==========`);
    console.log(`   Duración total: ${globalStats.duration}s`);
    console.log(`   Bots procesados: ${globalStats.bots}/${validBots.length}`);
    console.log(`   Chats: ${globalStats.chats}`);
    console.log(`   Mensajes nuevos: ${globalStats.messages}`);

    res.json({
      success: true,
      message: `Sincronización completada en ${globalStats.duration}s`,
      data: globalStats
    });

  } catch (error) {
    console.error('Error en full-sync selected-bots:', error);
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
