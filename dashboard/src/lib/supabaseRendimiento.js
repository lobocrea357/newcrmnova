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
  // Usar Express backend para guardar con SERVICE_ROLE_KEY
  try {
    const response = await fetch("/api/rendimiento/save-evaluations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ evaluations: evaluationsArray }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error guardando evaluaciones múltiples:", errorData);
      throw new Error(errorData.error || "Error guardando evaluaciones");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error en saveMultipleEvaluations:", error);
    throw error;
  }
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
  // Usar Express backend para crear con SERVICE_ROLE_KEY
  try {
    const response = await fetch("/api/rendimiento/create-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ analysisData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error creando análisis:", errorData);
      throw new Error(errorData.error || "Error creando análisis");
    }

    const result = await response.json();
    return result.analysis;
  } catch (error) {
    console.error("Error en createPerformanceAnalysis:", error);
    throw error;
  }
}

/**
 * Crea un análisis Y genera automáticamente su reporte
 * @param {Object} analysisData - Datos del análisis
 * @param {Array} evaluations - Evaluaciones individuales de conversaciones
 * @returns {Promise<{analysis, report}>}
 */
export async function createAnalysisWithReport(analysisData, evaluations = []) {
  console.log("📊 createAnalysisWithReport - Iniciando...");
  console.log("   Evaluaciones recibidas:", evaluations.length);

  let analysis = null;

  try {
    // 1. Crear análisis en BD con evaluaciones
    console.log("   1️⃣ Creando análisis en BD...");

    // Usar Next.js API para crear análisis CON evaluaciones
    const response = await fetch("/api/rendimiento/create-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        analysisData,
        evaluations, // Pasar evaluaciones para calcular stats correctamente
      }),
    });

    console.log(`   📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error creando análisis:", errorData);
      console.error("   Status:", response.status);
      console.error("   Error details:", errorData);
      throw new Error(errorData.error || "Error creando análisis");
    }

    const result = await response.json();
    console.log("   📦 API Response:", result);

    if (!result.analysis) {
      console.error("❌ API no retornó analysis:", result);
      throw new Error("API no retornó el objeto analysis");
    }

    analysis = result.analysis;
    console.log(`   ✅ Análisis creado con ID: ${analysis.id}`);

    // 2. Generar reporte automáticamente con IA
    console.log("   2️⃣ Generando reporte con IA...");
    const { generatePerformanceReport } = await import("./aiPerformance");

    // Validar que las evaluaciones tengan el formato correcto
    const evaluationsForReport = Array.isArray(evaluations)
      ? evaluations
      : Object.values(evaluations);

    if (evaluationsForReport.length === 0) {
      console.warn(
        "   ⚠️ No hay evaluaciones para generar reporte, usando fallback",
      );
    }

    const reportResult = await generatePerformanceReport(
      evaluationsForReport,
      analysisData.analysis_name || "Asesor",
    );

    // Verificar si la generación del reporte fue exitosa
    if (!reportResult.success) {
      console.error(
        "   ❌ Error generando reporte con IA:",
        reportResult.error,
      );
      throw new Error(`Error en generación de reporte: ${reportResult.error}`);
    }

    console.log("   ✅ Reporte generado por IA exitosamente");

    // 3. Guardar el reporte en BD
    console.log("   3️⃣ Guardando reporte en BD...");
    const report = await createReport({
      performance_analysis_id: analysis.id,
      report_data: reportResult.report,
      report_type: "automatic",
      report_name: `Reporte ${analysisData.analysis_name || "automático"}`,
    });

    console.log(`   ✅ Reporte guardado con ID: ${report.id}`);
    console.log("✅ Análisis y reporte creados exitosamente");

    return { analysis, report };
  } catch (error) {
    console.error("❌ Error en createAnalysisWithReport:", {
      message: error.message,
      stack: error.stack,
      analysisCreated: analysis !== null,
      analysisId: analysis?.id,
    });

    // Si el análisis se creó pero falló el reporte, retornar el análisis de todos modos
    if (analysis) {
      console.warn(
        "⚠️ Análisis creado pero sin reporte. Retornando análisis sin reporte.",
      );
      return {
        analysis,
        report: null,
        reportError: error.message,
      };
    }

    // Si falló todo, propagar el error
    throw error;
  }
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
  // Usar Next.js API para crear con SERVICE_ROLE_KEY
  try {
    const response = await fetch("/api/rendimiento/create-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error creando reporte:", errorData);
      throw new Error(errorData.error || "Error creando reporte");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error en createReport:", error);
    throw error;
  }
}

export async function getReportsByAnalysis(analysisId) {
  try {
    const response = await fetch(
      `/api/rendimiento/create-report?analysisId=${analysisId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error obteniendo reportes:", errorData);
      throw new Error(errorData.error || "Error obteniendo reportes");
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error en getReportsByAnalysis:", error);
    throw error;
  }
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

  // Agrupar por bot_id (cada bot es un asesor)
  const statsById = {};

  analyses.forEach((analysis) => {
    const botId = analysis.bot_id;

    if (!botId) return; // Skip si no tiene bot

    if (!statsById[botId]) {
      // Parsear nombre del bot
      const botDisplayName = analysis.bot?.session_name
        ? parseBotSessionName(analysis.bot.session_name).fullName
        : "Sin nombre";

      statsById[botId] = {
        worker: {
          id: botId,
          name: botDisplayName,
          email: analysis.worker?.email || "Sin email",
        },
        botId: botId,
        botSessionName: analysis.bot?.session_name,
        analyses: [],
        totalConversations: 0,
        averageScore: 0,
        averagePercentage: 0,
        latestAnalysis: null,
        trend: 0,
      };
    }

    statsById[botId].analyses.push(analysis);
    statsById[botId].totalConversations +=
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
  console.log("📈 calculateAnalysisStats - Iniciando cálculo");
  console.log("   Tipo de evaluaciones:", typeof evaluaciones);
  console.log("   Es array?:", Array.isArray(evaluaciones));

  const evaluacionesArray = Object.values(evaluaciones);
  const totalConversations = evaluacionesArray.length;

  console.log(`   Total conversaciones: ${totalConversations}`);

  if (totalConversations === 0) {
    console.warn("⚠️ No hay evaluaciones para calcular stats");
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

  // Mostrar primera evaluación como ejemplo
  console.log("   Primera evaluación (ejemplo):", {
    score: evaluacionesArray[0]?.score,
    percentage: evaluacionesArray[0]?.percentage,
    tiempo_contacto: evaluacionesArray[0]?.tiempo_contacto,
  });

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

  const stats = {
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

  console.log("✅ Stats calculados:", stats);
  return stats;
}
