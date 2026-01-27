import { supabase } from "./supabase";
import { parseBotSessionName } from "./botNameParser";

// ============================================
// FUNCIONES PARA CONVERSATION_EVALUATIONS
// ============================================

export async function saveConversationEvaluation(evaluationData) {
  const { data, error } = await supabase
    .from("conversation_evaluations")
    .insert(evaluationData)
    .select()
    .single();

  if (error) {
    console.error("Error guardando evaluación:", error);
    throw error;
  }

  return data;
}

export async function saveMultipleEvaluations(evaluationsArray) {
  const { data, error } = await supabase
    .from("conversation_evaluations")
    .insert(evaluationsArray)
    .select();

  if (error) {
    console.error("Error guardando evaluaciones múltiples:", error);
    throw error;
  }

  return data;
}

export async function getEvaluationsByChat(chatId) {
  const { data, error } = await supabase
    .from("conversation_evaluations")
    .select("*")
    .eq("chat_id", chatId)
    .order("evaluation_date", { ascending: false });

  if (error) {
    console.error("Error obteniendo evaluaciones:", error);
    throw error;
  }

  return data;
}

export async function updateEvaluation(evaluationId, updateData) {
  const { data, error } = await supabase
    .from("conversation_evaluations")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", evaluationId)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando evaluación:", error);
    throw error;
  }

  return data;
}

// ============================================
// FUNCIONES PARA PERFORMANCE_ANALYSES
// ============================================

export async function createPerformanceAnalysis(analysisData) {
  const { data, error } = await supabase
    .from("performance_analyses")
    .insert(analysisData)
    .select()
    .single();

  if (error) {
    console.error("Error creando análisis:", error);
    throw error;
  }

  return data;
}

export async function getAnalysisById(analysisId) {
  const { data, error } = await supabase
    .from("performance_analyses")
    .select(
      `
      *,
      bot:bots(id, session_name, phone_number),
      worker:workers(id, name, email),
      created_by:profiles(id, full_name, email)
    `,
    )
    .eq("id", analysisId)
    .single();

  if (error) {
    console.error("Error obteniendo análisis:", error);
    throw error;
  }

  return data;
}

export async function getAllAnalyses(filters = {}) {
  let query = supabase
    .from("performance_analyses")
    .select(
      `
      *,
      bot:bots(id, session_name, phone_number),
      worker:workers(id, name, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (filters.worker_id) {
    query = query.eq("worker_id", filters.worker_id);
  }

  if (filters.bot_id) {
    query = query.eq("bot_id", filters.bot_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.period_start) {
    query = query.gte("period_start", filters.period_start);
  }

  if (filters.period_end) {
    query = query.lte("period_end", filters.period_end);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error obteniendo análisis:", error);
    throw error;
  }

  return data;
}

export async function getAnalysesByWorker(workerId) {
  const { data, error } = await supabase
    .from("performance_analyses")
    .select(
      `
      *,
      bot:bots(id, session_name),
      worker:workers(id, name)
    `,
    )
    .eq("worker_id", workerId)
    .eq("status", "finalized")
    .order("period_start", { ascending: false });

  if (error) {
    console.error("Error obteniendo análisis por trabajador:", error);
    throw error;
  }

  return data;
}

export async function finalizeAnalysis(analysisId) {
  const { data, error } = await supabase
    .from("performance_analyses")
    .update({
      status: "finalized",
      finalized_at: new Date().toISOString(),
    })
    .eq("id", analysisId)
    .select()
    .single();

  if (error) {
    console.error("Error finalizando análisis:", error);
    throw error;
  }

  return data;
}

export async function updateAnalysis(analysisId, updateData) {
  const { data, error } = await supabase
    .from("performance_analyses")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", analysisId)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando análisis:", error);
    throw error;
  }

  return data;
}

// ============================================
// FUNCIONES PARA OBTENER EVALUACIONES DE UN ANÁLISIS
// ============================================

export async function getEvaluationsByAnalysis(analysisId) {
  const { data, error } = await supabase
    .from("conversation_evaluations")
    .select(
      `
      *,
      chat:chats(id, contact_name, contact_number, chat_id)
    `,
    )
    .eq("performance_analysis_id", analysisId)
    .order("evaluation_date", { ascending: false });

  if (error) {
    console.error("Error obteniendo evaluaciones del análisis:", error);
    throw error;
  }

  return data;
}

// ============================================
// FUNCIONES PARA REPORTES
// ============================================

export async function createReport(reportData) {
  // Asegurar que report_data se guarde correctamente
  // Si la tabla no tiene campo report_data dedicado, usar file_url como JSON string
  const reportToSave = {
    ...reportData,
    // Guardar el JSON del reporte como string si viene en report_data
    file_url: reportData.report_data 
      ? JSON.stringify(reportData.report_data) 
      : reportData.file_url,
  };

  const { data, error } = await supabase
    .from("performance_reports")
    .insert(reportToSave)
    .select()
    .single();

  if (error) {
    console.error("Error creando reporte:", error);
    throw error;
  }

  return data;
}

export async function getReportsByAnalysis(analysisId) {
  const { data, error } = await supabase
    .from("performance_reports")
    .select("*")
    .eq("performance_analysis_id", analysisId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error obteniendo reportes:", error);
    throw error;
  }

  return data;
}

// ============================================
// FUNCIONES PARA DASHBOARD - ESTADÍSTICAS GENERALES
// ============================================

export async function getDashboardStats() {
  // Obtener todos los análisis finalizados con bot info
  const { data: analyses, error: analysesError } = await supabase
    .from("performance_analyses")
    .select(
      `
      *,
      worker:workers(id, name, email),
      bot:bots(id, session_name)
    `,
    )
    .eq("status", "finalized")
    .order("created_at", { ascending: false });

  if (analysesError) {
    console.error("Error obteniendo estadísticas:", analysesError);
    throw analysesError;
  }

  // Agrupar por worker O por bot si no hay worker
  const statsById = {};

  analyses.forEach((analysis) => {
    // Crear key única: usar worker_id si existe, sino usar bot_id
    const groupKey = analysis.worker_id || `bot_${analysis.bot_id}`;

    if (!statsById[groupKey]) {
      // Parsear nombre del bot si no hay worker
      const botDisplayName = analysis.bot?.session_name
        ? parseBotSessionName(analysis.bot.session_name).fullName
        : "Asesor sin asignar";

      statsById[groupKey] = {
        worker: analysis.worker || {
          id: `bot_${analysis.bot_id}`,
          name: botDisplayName,
          email: "Sin email",
        },
        analyses: [],
        totalConversations: 0,
        averageScore: 0,
        averagePercentage: 0,
        latestAnalysis: null,
        trend: 0,
      };
    }

    statsById[groupKey].analyses.push(analysis);
    statsById[groupKey].totalConversations +=
      analysis.total_conversations_analyzed || 0;
  });

  // Calcular promedios y tendencias
  Object.keys(statsById).forEach((groupKey) => {
    const stats = statsById[groupKey];
    const analysesCount = stats.analyses.length;

    if (analysesCount > 0) {
      stats.averageScore =
        stats.analyses.reduce(
          (sum, a) => sum + parseFloat(a.average_score || 0),
          0,
        ) / analysesCount;
      stats.averagePercentage =
        stats.analyses.reduce(
          (sum, a) => sum + parseFloat(a.average_percentage || 0),
          0,
        ) / analysesCount;
      stats.latestAnalysis = stats.analyses[0];

      // Calcular tendencia (comparar último con penúltimo)
      if (analysesCount >= 2) {
        const latest = parseFloat(stats.analyses[0].average_percentage || 0);
        const previous = parseFloat(stats.analyses[1].average_percentage || 0);
        stats.trend = latest - previous;
      }
    }
  });

  return Object.values(statsById);
}

export async function getRecentAnalyses(limit = 10) {
  const { data, error } = await supabase
    .from("performance_analyses")
    .select(
      `
      *,
      bot:bots(id, session_name),
      worker:workers(id, name)
    `,
    )
    .eq("status", "finalized")
    .order("finalized_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error obteniendo análisis recientes:", error);
    throw error;
  }

  return data;
}

// ============================================
// FUNCIÓN HELPER: Calcular estadísticas de evaluaciones
// ============================================

export function calculateAnalysisStats(evaluaciones) {
  const evaluacionesArray = Object.values(evaluaciones);
  const totalConversations = evaluacionesArray.length;

  if (totalConversations === 0) {
    return {
      total_conversations_analyzed: 0,
      average_score: 0,
      average_percentage: 0,
      tiempo_contacto_count: 0,
      tiempo_respuesta_count: 0,
      tiempo_cotizacion_count: 0,
      cierre_intencion_count: 0,
      ofrecio_scalapay_count: 0,
      mas_dos_opciones_count: 0,
      seguimiento_intencion_count: 0,
    };
  }

  const totals = evaluacionesArray.reduce(
    (acc, ev) => {
      return {
        score: acc.score + (ev.score || 0),
        percentage: acc.percentage + parseFloat(ev.percentage || 0),
        tiempo_contacto: acc.tiempo_contacto + (ev.tiempo_contacto ? 1 : 0),
        tiempo_respuesta: acc.tiempo_respuesta + (ev.tiempo_respuesta ? 1 : 0),
        tiempo_cotizacion:
          acc.tiempo_cotizacion + (ev.tiempo_cotizacion ? 1 : 0),
        cierre_intencion: acc.cierre_intencion + (ev.cierre_intencion ? 1 : 0),
        ofrecio_scalapay: acc.ofrecio_scalapay + (ev.ofrecio_scalapay ? 1 : 0),
        mas_dos_opciones: acc.mas_dos_opciones + (ev.mas_dos_opciones ? 1 : 0),
        seguimiento_intencion:
          acc.seguimiento_intencion + (ev.seguimiento_intencion ? 1 : 0),
      };
    },
    {
      score: 0,
      percentage: 0,
      tiempo_contacto: 0,
      tiempo_respuesta: 0,
      tiempo_cotizacion: 0,
      cierre_intencion: 0,
      ofrecio_scalapay: 0,
      mas_dos_opciones: 0,
      seguimiento_intencion: 0,
    },
  );

  return {
    total_conversations_analyzed: totalConversations,
    average_score: (totals.score / totalConversations).toFixed(2),
    average_percentage: (totals.percentage / totalConversations).toFixed(2),
    tiempo_contacto_count: totals.tiempo_contacto,
    tiempo_respuesta_count: totals.tiempo_respuesta,
    tiempo_cotizacion_count: totals.tiempo_cotizacion,
    cierre_intencion_count: totals.cierre_intencion,
    ofrecio_scalapay_count: totals.ofrecio_scalapay,
    mas_dos_opciones_count: totals.mas_dos_opciones,
    seguimiento_intencion_count: totals.seguimiento_intencion,
  };
}
