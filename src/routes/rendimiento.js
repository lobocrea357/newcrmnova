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

    // IMPORTANTE: messages.chat_id es UUID (FK a chats.id), NO el WhatsApp ID
    // Siempre usar el UUID del chat
    let chatUuid = chatId;

    // Si solo tenemos WhatsApp ID, buscar el UUID del chat
    if (!chatUuid && chatWhatsAppId) {
      console.log(`   🔍 Buscando UUID del chat con WhatsApp ID: ${chatWhatsAppId}`);
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('chat_id', chatWhatsAppId)
        .single();

      if (chatError || !chat) {
        console.error('❌ Chat no encontrado:', chatError?.message);
        return res.status(404).json({
          success: false,
          error: 'Chat no encontrado',
          details: chatError?.message || 'No existe un chat con ese WhatsApp ID'
        });
      }

      chatUuid = chat.id;
      console.log(`   ✅ UUID encontrado: ${chatUuid}`);
    }

    // Consultar mensajes usando el UUID
    console.log(`   📝 Consultando mensajes con UUID: ${chatUuid}`);
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, body, content, from_me, timestamp, type, chat_id')
      .eq('chat_id', chatUuid)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ Error consultando mensajes:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al consultar mensajes',
        details: error.message
      });
    }

    if (!messages || messages.length === 0) {
      console.log(`   ⚠️ No se encontraron mensajes para el chat ${chatUuid}`);
      return res.json({
        success: true,
        messages: [],
        count: 0
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

    // Recalcular stats desde evaluaciones si las hay
    let finalAnalysisData = { ...analysisData };
    if (evaluations.length > 0) {
      console.log(`   📈 Recalculando stats desde ${evaluations.length} evaluaciones`);
      
      const totals = evaluations.reduce((acc, ev) => ({
        score: acc.score + (ev.score || 0),
        percentage: acc.percentage + parseFloat(ev.percentage || 0),
        tiempo_contacto: acc.tiempo_contacto + (ev.tiempo_contacto ? 1 : 0),
        tiempo_respuesta: acc.tiempo_respuesta + (ev.tiempo_respuesta ? 1 : 0),
        tiempo_cotizacion: acc.tiempo_cotizacion + (ev.tiempo_cotizacion ? 1 : 0),
        cierre_intencion: acc.cierre_intencion + (ev.cierre_intencion ? 1 : 0),
        ofrecio_scalapay: acc.ofrecio_scalapay + (ev.ofrecio_scalapay ? 1 : 0),
        mas_dos_opciones: acc.mas_dos_opciones + (ev.mas_dos_opciones ? 1 : 0),
        seguimiento_intencion: acc.seguimiento_intencion + (ev.seguimiento_intencion ? 1 : 0),
      }), {
        score: 0, percentage: 0, tiempo_contacto: 0, tiempo_respuesta: 0,
        tiempo_cotizacion: 0, cierre_intencion: 0, ofrecio_scalapay: 0,
        mas_dos_opciones: 0, seguimiento_intencion: 0,
      });

      finalAnalysisData = {
        ...analysisData,
        total_conversations_analyzed: evaluations.length,
        average_score: (totals.score / evaluations.length).toFixed(2),
        average_percentage: (totals.percentage / evaluations.length).toFixed(2),
        tiempo_contacto_count: totals.tiempo_contacto,
        tiempo_respuesta_count: totals.tiempo_respuesta,
        tiempo_cotizacion_count: totals.tiempo_cotizacion,
        cierre_intencion_count: totals.cierre_intencion,
        ofrecio_scalapay_count: totals.ofrecio_scalapay,
        mas_dos_opciones_count: totals.mas_dos_opciones,
        seguimiento_intencion_count: totals.seguimiento_intencion,
      };

      console.log(`   ✅ Stats calculados: ${finalAnalysisData.average_score}/7 (${finalAnalysisData.average_percentage}%)`);
    }

    // 1. Crear análisis con stats correctos
    const { data: analysis, error: analysisError } = await supabase
      .from('performance_analyses')
      .insert(finalAnalysisData)
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

    // 2. Si hay evaluaciones, guardarlas con el analysis_id
    let savedEvaluations = [];
    if (evaluations.length > 0) {
      const evaluationsWithAnalysisId = evaluations.map(ev => ({
        ...ev,
        performance_analysis_id: analysis.id
      }));

      const { data: evals, error: evalsError } = await supabase
        .from('conversation_evaluations')
        .insert(evaluationsWithAnalysisId)
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
