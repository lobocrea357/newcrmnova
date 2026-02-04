import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/rendimiento/get-messages
 * Obtiene mensajes de un chat para análisis de IA
 * Body: { chatId, chatWhatsAppId, limit }
 */
router.post('/get-messages', async (req, res) => {
  try {
    const { chatId, chatWhatsAppId, limit = 30 } = req.body;
    
    console.log(`📨 GET MESSAGES REQUEST:`, {
      chatId,
      chatWhatsAppId,
      limit
    });

    if (!chatId && !chatWhatsAppId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere chatId o chatWhatsAppId'
      });
    }

    let query = supabase
      .from('messages')
      .select('id, body, content, from_me, timestamp, type, chat_id')
      .order('timestamp', { ascending: true })
      .limit(limit);

    // Intentar primero con chatWhatsAppId (formato: 573148635621@c.us)
    if (chatWhatsAppId) {
      console.log(`   Consultando por WhatsApp ID: ${chatWhatsAppId}`);
      query = query.eq('chat_id', chatWhatsAppId);
    } else {
      console.log(`   Consultando por UUID: ${chatId}`);
      query = query.eq('chat_id', chatId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('❌ Error consultando mensajes:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al consultar mensajes',
        details: error.message
      });
    }

    // Si no hay mensajes con WhatsApp ID, intentar con UUID
    if ((!messages || messages.length === 0) && chatWhatsAppId && chatId) {
      console.log(`   ⚠️ No hay mensajes con WhatsApp ID, intentando UUID...`);
      const { data: messagesUuid, error: errorUuid } = await supabase
        .from('messages')
        .select('id, body, content, from_me, timestamp, type, chat_id')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (!errorUuid && messagesUuid && messagesUuid.length > 0) {
        console.log(`   ✅ ${messagesUuid.length} mensajes encontrados con UUID`);
        return res.json({
          success: true,
          messages: messagesUuid,
          count: messagesUuid.length
        });
      }
    }

    if (!messages || messages.length === 0) {
      console.log(`   ⚠️ No se encontraron mensajes`);
      return res.status(404).json({
        success: false,
        error: 'Chat no encontrado',
        details: 'No hay mensajes en este chat'
      });
    }

    console.log(`   ✅ ${messages.length} mensajes encontrados`);
    res.json({
      success: true,
      messages,
      count: messages.length
    });

  } catch (error) {
    console.error('💥 Error en get-messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/rendimiento/save-evaluations
 * Guarda evaluaciones de IA en Supabase
 * Body: { evaluations: [...] }
 */
router.post('/save-evaluations', async (req, res) => {
  try {
    const { evaluations } = req.body;

    if (!evaluations || !Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de evaluations'
      });
    }

    console.log(`💾 Guardando ${evaluations.length} evaluaciones...`);

    const { data, error } = await supabase
      .from('conversation_evaluations')
      .insert(evaluations)
      .select();

    if (error) {
      console.error('❌ Error guardando evaluaciones:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al guardar evaluaciones',
        details: error.message
      });
    }

    console.log(`✅ ${data.length} evaluaciones guardadas`);
    res.json({
      success: true,
      data,
      count: data.length
    });

  } catch (error) {
    console.error('💥 Error en save-evaluations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/rendimiento/create-analysis
 * Crea un análisis de rendimiento con su reporte
 * Body: { analysisData, evaluations }
 */
router.post('/create-analysis', async (req, res) => {
  try {
    const { analysisData, evaluations = [] } = req.body;

    if (!analysisData) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere analysisData'
      });
    }

    console.log(`📊 Creando análisis de rendimiento...`);
    console.log(`   Bot: ${analysisData.bot_id}`);
    console.log(`   Worker: ${analysisData.worker_email}`);
    console.log(`   Evaluaciones: ${evaluations.length}`);

    // 1. Crear análisis
    const { data: analysis, error: analysisError } = await supabase
      .from('performance_analyses')
      .insert(analysisData)
      .select()
      .single();

    if (analysisError) {
      console.error('❌ Error creando análisis:', analysisError);
      return res.status(500).json({
        success: false,
        error: 'Error al crear análisis',
        details: analysisError.message
      });
    }

    console.log(`✅ Análisis creado: ${analysis.id}`);

    // 2. Si hay evaluaciones, guardarlas
    let savedEvaluations = [];
    if (evaluations.length > 0) {
      const { data: evals, error: evalsError } = await supabase
        .from('conversation_evaluations')
        .insert(evaluations)
        .select();

      if (evalsError) {
        console.error('⚠️ Error guardando evaluaciones:', evalsError);
      } else {
        savedEvaluations = evals;
        console.log(`✅ ${evals.length} evaluaciones guardadas`);
      }
    }

    res.json({
      success: true,
      analysis,
      evaluations: savedEvaluations
    });

  } catch (error) {
    console.error('💥 Error en create-analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/rendimiento/create-report
 * Crea un reporte de rendimiento
 * Body: { reportData }
 */
router.post('/create-report', async (req, res) => {
  try {
    const { reportData } = req.body;

    if (!reportData) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere reportData'
      });
    }

    console.log(`📝 Creando reporte de rendimiento...`);

    const { data, error } = await supabase
      .from('performance_reports')
      .insert(reportData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando reporte:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al crear reporte',
        details: error.message
      });
    }

    console.log(`✅ Reporte creado: ${data.id}`);
    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('💥 Error en create-report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
