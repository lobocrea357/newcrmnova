/**
 * Integración del Sistema de Análisis de Ventas con Rendimiento Existente
 * Combina los parámetros tradicionales con los nuevos parámetros enfocados en ventas
 */

import { PARAMETROS_EVALUACION, CRITERIOS_IA } from './mockRendimiento';
import {
  PARAMETROS_VENTAS,
  CRITERIOS_VENTAS_IA,
  evaluateAllSalesParameters,
  generateSalesRecommendations,
  generateSalesStats
} from './salesDetection';

// ============================================
// PARÁMETROS COMBINADOS (EXISTENTES + VENTAS)
// ============================================

export const PARAMETROS_COMPLETOS = [
  // Parámetros existentes (proceso)
  ...PARAMETROS_EVALUACION,
  // Nuevos parámetros (resultados)
  ...PARAMETROS_VENTAS
];

// ============================================
// ANÁLISIS HÍBRIDO: PROCESO + RESULTADOS
// ============================================

/**
 * Realiza análisis completo combinando parámetros de proceso y ventas
 * @param {Array} messages - Mensajes de la conversación
 * @param {Object} conversationData - Datos adicionales de la conversación
 * @returns {Promise<Object>} - Evaluación completa
 */
export async function analyzeCompletePerformance(messages, conversationData = {}) {
  try {
    // 1. Análisis de ventas (nuevo sistema)
    const salesAnalysis = await analyzeSalesConversation(messages, conversationData);

    // 2. Análisis de proceso (sistema existente)
    const processAnalysis = await analyzeProcessParameters(messages);

    // 3. Combinar resultados
    const combinedEvaluation = {
      // Datos básicos
      chat_id: conversationData.chat_id,
      contact_name: conversationData.contact_name || 'Cliente',
      contact_number: conversationData.contact_number,

      // Parámetros de proceso (existentes)
      ...processAnalysis,

      // Parámetros de ventas (nuevos)
      ...salesAnalysis,

      // Scores combinados
      score_proceso: processAnalysis.score || 0,
      score_ventas: salesAnalysis.score_ventas || 0,
      score_total: (processAnalysis.score || 0) + (salesAnalysis.score_ventas || 0),

      // Porcentajes
      percentage_proceso: processAnalysis.percentage || 0,
      percentage_ventas: salesAnalysis.percentage_ventas || 0,
      percentage_total: calculateCombinedPercentage(processAnalysis, salesAnalysis),

      // Clasificación de resultado
      resultado_comercial: classifyCommercialResult(salesAnalysis),

      // Timestamps
      evaluation_date: new Date().toISOString(),
      generated_by: 'AI_HIBRIDO'
    };

    // 4. Generar recomendaciones combinadas
    const recommendations = generateCombinedRecommendations(processAnalysis, salesAnalysis, messages);

    return {
      success: true,
      evaluation: combinedEvaluation,
      recommendations,
      analysis_summary: generateAnalysisSummary(combinedEvaluation)
    };

  } catch (error) {
    console.error('Error en análisis completo de rendimiento:', error);
    return {
      success: false,
      error: error.message,
      evaluation: null,
      recommendations: null
    };
  }
}

/**
 * Analiza conversación enfocándose en resultados de ventas
 * @param {Array} messages - Mensajes de la conversación
 * @param {Object} conversationData - Datos de la conversación
 * @returns {Promise<Object>} - Análisis de ventas
 */
async function analyzeSalesConversation(messages, conversationData) {
  try {
    // Opción 1: Usar API de OpenAI (más preciso)
    const response = await fetch('/api/analyze-sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        contact_info: conversationData,
        use_local_analysis: false // Usar OpenAI por defecto
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      console.warn('API OpenAI no disponible, usando análisis local');
      // Fallback a análisis local
      return evaluateAllSalesParameters(messages);
    }
  } catch (error) {
    console.warn('Error en API, usando análisis local:', error);
    // Fallback a análisis local
    return evaluateAllSalesParameters(messages);
  }
}

/**
 * Analiza parámetros de proceso usando el sistema existente
 * @param {Array} messages - Mensajes de la conversación
 * @returns {Object} - Evaluación de proceso
 */
async function analyzeProcessParameters(messages) {
  // Por ahora usar el sistema mock existente
  // En el futuro se puede integrar con análisis IA de proceso
  const mockEvaluation = {
    tiempo_contacto: analyzeTimeParameter(messages, 'contacto'),
    tiempo_respuesta: analyzeTimeParameter(messages, 'respuesta'),
    tiempo_cotizacion: analyzeTimeParameter(messages, 'cotizacion'),
    cierre_intencion: analyzeCierreIntencion(messages),
    ofrecio_scalapay: analyzeKeywordParameter(messages, 'scalapay'),
    mas_dos_opciones: analyzeMultipleOptions(messages),
    seguimiento_intencion: analyzeSeguimiento(messages)
  };

  // Calcular score de proceso
  const processScore = Object.values(mockEvaluation).filter(Boolean).length;
  const maxProcessScore = PARAMETROS_EVALUACION.length;

  return {
    ...mockEvaluation,
    score: processScore,
    max_score: maxProcessScore,
    percentage: ((processScore / maxProcessScore) * 100).toFixed(1)
  };
}

/**
 * Calcula porcentaje combinado de proceso y ventas
 */
function calculateCombinedPercentage(processAnalysis, salesAnalysis) {
  const processPct = parseFloat(processAnalysis.percentage || 0);
  const salesPct = parseFloat(salesAnalysis.percentage_ventas || 0);

  // Peso mayor a resultados comerciales
  const combinedPct = (processPct * 0.3 + salesPct * 0.7);
  return combinedPct.toFixed(1);
}

/**
 * Clasifica el resultado comercial de la conversación
 */
function classifyCommercialResult(salesAnalysis) {
  if (salesAnalysis.venta_confirmada) {
    return {
      tipo: 'VENTA_CONFIRMADA',
      descripcion: 'Cliente confirmó compra',
      valor: salesAnalysis.valor_venta || 0,
      prioridad: 'ALTA'
    };
  }

  if (salesAnalysis.lead_caliente) {
    return {
      tipo: 'LEAD_CALIENTE',
      descripcion: 'Cliente con alto interés',
      valor: salesAnalysis.valor_estimado || 0,
      prioridad: 'MEDIA'
    };
  }

  if (salesAnalysis.cotizacion_enviada) {
    return {
      tipo: 'COTIZACION_ENVIADA',
      descripcion: 'Se proporcionó información de precios',
      valor: salesAnalysis.valor_estimado || 0,
      prioridad: 'BAJA'
    };
  }

  return {
    tipo: 'SIN_INTERES',
    descripcion: 'No se detectó interés comercial',
    valor: 0,
    prioridad: 'MINIMA'
  };
}

/**
 * Genera recomendaciones combinadas de proceso y ventas
 */
function generateCombinedRecommendations(processAnalysis, salesAnalysis, messages) {
  const processRecommendations = generateProcessRecommendations(processAnalysis);
  const salesRecommendations = generateSalesRecommendations(salesAnalysis, messages);

  return {
    // Prioridad a recomendaciones comerciales
    principales: [
      ...salesRecommendations.recomendaciones.slice(0, 3),
      ...processRecommendations.slice(0, 2)
    ],
    exitos: [
      ...salesRecommendations.exitos,
      ...processRecommendations.filter(r => r.startsWith('✅'))
    ],
    errores: [
      ...salesRecommendations.errores,
      ...processRecommendations.filter(r => r.startsWith('❌'))
    ],
    siguiente_accion: salesRecommendations.siguiente_accion,
    enfoque_mejora: determineImprovementFocus(processAnalysis, salesAnalysis)
  };
}

/**
 * Determina el área de enfoque principal para mejora
 */
function determineImprovementFocus(processAnalysis, salesAnalysis) {
  const processScore = parseFloat(processAnalysis.percentage || 0);
  const salesScore = parseFloat(salesAnalysis.percentage_ventas || 0);

  if (salesScore < 30) {
    return 'COMERCIAL_CRITICO';
  } else if (processScore < 50) {
    return 'PROCESO_DEFICIENTE';
  } else if (salesScore < 60) {
    return 'CONVERSION_BAJA';
  } else {
    return 'OPTIMIZACION_GENERAL';
  }
}

/**
 * Genera resumen ejecutivo del análisis
 */
function generateAnalysisSummary(evaluation) {
  const resultado = evaluation.resultado_comercial;
  const scoreTotal = parseFloat(evaluation.percentage_total);

  let nivel = 'DEFICIENTE';
  if (scoreTotal >= 80) nivel = 'EXCELENTE';
  else if (scoreTotal >= 70) nivel = 'BUENO';
  else if (scoreTotal >= 60) nivel = 'REGULAR';

  return {
    nivel_general: nivel,
    resultado_comercial: resultado.tipo,
    valor_detectado: resultado.valor,
    score_total: scoreTotal,
    area_critica: determineImprovementFocus(
      { percentage: evaluation.percentage_proceso },
      { percentage_ventas: evaluation.percentage_ventas }
    ),
    requiere_seguimiento: resultado.prioridad === 'ALTA' || resultado.prioridad === 'MEDIA'
  };
}

// ============================================
// FUNCIONES AUXILIARES PARA PARÁMETROS DE PROCESO
// ============================================

function analyzeTimeParameter(messages, type) {
  // Implementación simplificada - en producción usar análisis temporal real
  const advisorMessages = messages.filter(m => m.from_me);
  const clientMessages = messages.filter(m => !m.from_me);

  if (advisorMessages.length === 0 || clientMessages.length === 0) return false;

  // Simular análisis temporal básico
  return Math.random() > 0.4; // 60% probabilidad de cumplir
}

function analyzeCierreIntencion(messages) {
  const advisorText = messages
    .filter(m => m.from_me)
    .map(m => (m.body || m.content || '').toLowerCase())
    .join(' ');

  const cierreKeywords = [
    'método de pago', 'cuenta bancaria', 'transferencia', 'oficina',
    'llamada', 'pasaporte', 'presupuesto', 'ubicación'
  ];

  return cierreKeywords.some(keyword => advisorText.includes(keyword));
}

function analyzeKeywordParameter(messages, keyword) {
  const allText = messages
    .map(m => (m.body || m.content || '').toLowerCase())
    .join(' ');

  return allText.includes(keyword.toLowerCase());
}

function analyzeMultipleOptions(messages) {
  const advisorMessages = messages.filter(m => m.from_me);
  const optionKeywords = ['opción', 'paquete', 'plan', 'modalidad', 'alternativa'];
  let optionCount = 0;

  advisorMessages.forEach(msg => {
    const text = (msg.body || msg.content || '').toLowerCase();
    optionKeywords.forEach(keyword => {
      if (text.includes(keyword)) optionCount++;
    });
  });

  return optionCount >= 2;
}

function analyzeSeguimiento(messages) {
  const advisorText = messages
    .filter(m => m.from_me)
    .map(m => (m.body || m.content || '').toLowerCase())
    .join(' ');

  const seguimientoKeywords = [
    'alguna duda', 'qué te parece', 'te interesa', 'tienes preguntas',
    'puedo ayudarte', 'seguimiento'
  ];

  return seguimientoKeywords.some(keyword => advisorText.includes(keyword));
}

function generateProcessRecommendations(processAnalysis) {
  const recommendations = [];

  if (!processAnalysis.tiempo_contacto) {
    recommendations.push('❌ Mejorar tiempo de primera respuesta (máximo 15 minutos)');
  } else {
    recommendations.push('✅ Buen tiempo de contacto inicial');
  }

  if (!processAnalysis.tiempo_respuesta) {
    recommendations.push('❌ Reducir tiempo entre respuestas');
  }

  if (!processAnalysis.cierre_intencion) {
    recommendations.push('❌ Incluir más acciones de cierre (métodos de pago, llamadas)');
  }

  if (!processAnalysis.seguimiento_intencion) {
    recommendations.push('❌ Implementar seguimiento proactivo con preguntas');
  }

  return recommendations;
}

// ============================================
// ANÁLISIS BATCH PARA MÚLTIPLES CONVERSACIONES
// ============================================

/**
 * Procesa múltiples conversaciones con análisis híbrido
 * @param {Array} conversations - Array de conversaciones
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<Object>} - Resultados del análisis masivo
 */
export async function analyzeConversationsBatchHybrid(conversations, onProgress = null) {
  console.log(`🔄 Iniciando análisis híbrido de ${conversations.length} conversaciones`);

  const results = {
    evaluations: {},
    sales_stats: {
      ventas_confirmadas: 0,
      leads_calientes: 0,
      valor_total: 0,
      tasa_conversion: 0
    },
    process_stats: {
      score_promedio_proceso: 0,
      parametros_criticos: []
    },
    combined_stats: {
      score_promedio_total: 0,
      nivel_general: 'REGULAR'
    }
  };

  // Procesar cada conversación
  for (let i = 0; i < conversations.length; i++) {
    const conversation = conversations[i];

    try {
      // Obtener mensajes de la conversación (aquí llamarías a tu función existente)
      const messages = await getMessagesForConversation(conversation.id);

      if (!messages || messages.length === 0) {
        console.warn(`Conversación ${conversation.id} sin mensajes`);
        continue;
      }

      // Realizar análisis híbrido
      const analysis = await analyzeCompletePerformance(messages, {
        chat_id: conversation.id,
        contact_name: conversation.contact_name || conversation.name,
        contact_number: conversation.contact_number || conversation.chat_id
      });

      if (analysis.success) {
        results.evaluations[conversation.id] = analysis.evaluation;

        // Acumular estadísticas de ventas
        if (analysis.evaluation.venta_confirmada) {
          results.sales_stats.ventas_confirmadas++;
        }
        if (analysis.evaluation.lead_caliente) {
          results.sales_stats.leads_calientes++;
        }
        if (analysis.evaluation.valor_venta) {
          results.sales_stats.valor_total += analysis.evaluation.valor_venta;
        }
      }

      // Callback de progreso
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: conversations.length,
          chatId: conversation.id,
          contactName: conversation.contact_name || 'Cliente',
          result: analysis.success ? 'completado' : 'error'
        });
      }

    } catch (error) {
      console.error(`Error analizando conversación ${conversation.id}:`, error);
    }
  }

  // Calcular estadísticas finales
  const totalEvaluations = Object.keys(results.evaluations).length;
  if (totalEvaluations > 0) {
    results.sales_stats.tasa_conversion =
      ((results.sales_stats.ventas_confirmadas / totalEvaluations) * 100).toFixed(1);

    const totalScores = Object.values(results.evaluations)
      .reduce((sum, eval) => sum + parseFloat(eval.percentage_total), 0);
    results.combined_stats.score_promedio_total = (totalScores / totalEvaluations).toFixed(1);
  }

  console.log('✅ Análisis híbrido completado:', results);
  return results;
}

// Función mock para obtener mensajes - reemplazar por la función real
async function getMessagesForConversation(conversationId) {
  // Esta función debería ser reemplazada por la función real que obtiene mensajes
  // Por ahora retorna array vacío
  return [];
}

// ============================================
// EXPORTACIONES
// ============================================

export {
  PARAMETROS_COMPLETOS,
  analyzeCompletePerformance,
  analyzeConversationsBatchHybrid,
  classifyCommercialResult
};
