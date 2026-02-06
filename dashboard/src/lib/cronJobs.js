/**
 * Sistema de Cron Jobs para Análisis Diario Automático de Ventas
 * Ejecuta análisis de rendimiento de asesores todos los días a las 24:00
 */

import cron from "node-cron";
import { supabase } from "./supabase";
import { analyzeCompletePerformance } from "./salesRendimiento";
import { getAllBots, isBotExcluded } from "./supabase";
import { loadConversationsForAnalysis } from "./conversationLoader";
import { parseBotSessionName } from "./botNameParser";
import {
  createPerformanceAnalysis,
  saveMultipleEvaluations,
  calculateAnalysisStats,
} from "./supabaseRendimiento";

// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

const DAILY_ANALYSIS_CONFIG = {
  cronTime: "0 0 * * *", // Todos los días a las 24:00 (00:00)
  timezone: "America/Bogota",
  maxConversationsPerAdvisor: 20,
  minMessagesPerConversation: 5,
  batchSize: 3, // Procesar 3 asesores simultáneamente
  retryAttempts: 2,
  timeoutMs: 15 * 60 * 1000, // 15 minutos timeout
};

// Estado global del sistema de cron
let cronJobInstance = null;
let isAnalysisRunning = false;
let lastAnalysisResult = null;

// ============================================
// FUNCIÓN PRINCIPAL DE ANÁLISIS DIARIO
// ============================================

/**
 * Ejecuta análisis completo de todos los asesores
 * Esta es la función principal que se ejecuta diariamente
 */
export async function performDailySalesAnalysis() {
  const startTime = Date.now();
  const analysisDate = new Date().toISOString().split("T")[0];

  console.log("🤖 Iniciando análisis diario automático de ventas...");
  console.log(`📅 Fecha de análisis: ${analysisDate}`);

  if (isAnalysisRunning) {
    console.log("⚠️ Análisis ya en ejecución, saltando...");
    return { success: false, error: "Análisis ya en progreso" };
  }

  isAnalysisRunning = true;

  try {
    // 1. Verificar configuración
    const config = await getCronConfiguration();
    if (!config.enabled) {
      console.log("📴 Análisis automático deshabilitado en configuración");
      return { success: false, error: "Análisis automático deshabilitado" };
    }

    // 2. Obtener lista de asesores activos
    const asesores = await getActiveAdvisors();
    console.log(`👥 Asesores encontrados: ${asesores.length}`);

    if (asesores.length === 0) {
      console.log("⚠️ No se encontraron asesores para analizar");
      return { success: true, message: "No hay asesores para analizar" };
    }

    // 3. Procesar asesores en lotes
    const results = {
      total_asesores: asesores.length,
      procesados: 0,
      exitosos: 0,
      errores: 0,
      ventas_totales: 0,
      valor_total: 0,
      detalles: [],
    };

    const batches = chunkArray(asesores, DAILY_ANALYSIS_CONFIG.batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `📦 Procesando lote ${i + 1}/${batches.length} (${batch.length} asesores)`,
      );

      // Procesar lote en paralelo
      const batchPromises = batch.map((asesor) =>
        processAdvisorSales(asesor, analysisDate),
      );
      const batchResults = await Promise.allSettled(batchPromises);

      // Procesar resultados del lote
      batchResults.forEach((result, index) => {
        const asesor = batch[index];
        results.procesados++;

        if (result.status === "fulfilled" && result.value.success) {
          results.exitosos++;
          results.ventas_totales += result.value.ventas_confirmadas || 0;
          results.valor_total += result.value.valor_total || 0;

          results.detalles.push({
            asesor_id: asesor.id,
            asesor_name: asesor.name,
            success: true,
            ventas: result.value.ventas_confirmadas || 0,
            leads: result.value.leads_calientes || 0,
            valor: result.value.valor_total || 0,
            conversaciones: result.value.conversaciones_analizadas || 0,
          });

          // Enviar notificación si hay ventas
          if (result.value.ventas_confirmadas > 0) {
            sendSalesNotification(asesor, result.value);
          }
        } else {
          results.errores++;
          const error =
            result.reason || result.value?.error || "Error desconocido";

          results.detalles.push({
            asesor_id: asesor.id,
            asesor_name: asesor.name,
            success: false,
            error: error,
          });

          console.error(`❌ Error procesando ${asesor.name}:`, error);
        }
      });

      // Pausa entre lotes para no sobrecargar el sistema
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const executionTime = Date.now() - startTime;

    // 4. Guardar resultado del análisis diario
    await logAnalysisResult(
      "daily_analysis_completed",
      {
        ...results,
        execution_time_ms: executionTime,
        analysis_date: analysisDate,
      },
      true,
    );

    // 5. Generar reporte consolidado si hay ventas
    if (results.ventas_totales > 0) {
      await generateConsolidatedReport(results, analysisDate);
    }

    lastAnalysisResult = {
      ...results,
      execution_time_ms: executionTime,
      completed_at: new Date().toISOString(),
    };

    console.log("✅ Análisis diario completado exitosamente");
    console.log(
      `📊 Resumen: ${results.exitosos}/${results.total_asesores} asesores, ${results.ventas_totales} ventas, $${results.valor_total.toLocaleString()}`,
    );
    console.log(`⏱️ Tiempo total: ${Math.round(executionTime / 1000)}s`);

    return { success: true, results };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error("💥 Error crítico en análisis diario:", error);

    await logAnalysisResult(
      "daily_analysis_failed",
      {
        error: error.message,
        stack: error.stack,
        execution_time_ms: executionTime,
      },
      false,
    );

    return { success: false, error: error.message };
  } finally {
    isAnalysisRunning = false;
  }
}

// ============================================
// PROCESAMIENTO INDIVIDUAL DE ASESORES
// ============================================

/**
 * Procesa un asesor individual
 * @param {Object} asesor - Datos del asesor
 * @param {string} analysisDate - Fecha de análisis
 * @returns {Promise<Object>} - Resultado del procesamiento
 */
async function processAdvisorSales(asesor, analysisDate) {
  const processingStart = Date.now();

  try {
    console.log(`🔍 Analizando asesor: ${asesor.name} (${asesor.id})`);

    // 1. Verificar si ya tiene análisis del día
    const existingAnalysis = await checkExistingDailyAnalysis(
      asesor.id,
      analysisDate,
    );
    if (existingAnalysis) {
      console.log(
        `⏭️ Asesor ${asesor.name} ya tiene análisis del día, saltando...`,
      );
      return { success: true, message: "Análisis ya existente", skip: true };
    }

    // 2. Cargar conversaciones del día
    const { conversations, stats: filterStats } =
      await loadConversationsForAnalysis(asesor.id, {
        targetValid: DAILY_ANALYSIS_CONFIG.maxConversationsPerAdvisor,
        maxAttempts: 100,
        excludeGroups: true,
        excludeInternal: true,
        useCache: true,
        minLastMessageDays: 1, // Solo conversaciones del último día
      });

    if (!conversations || conversations.length === 0) {
      console.log(`⚠️ No hay conversaciones para analizar - ${asesor.name}`);

      // Crear reporte vacío
      await createEmptyDailySalesReport(asesor, analysisDate);
      return {
        success: true,
        message: "Sin conversaciones",
        conversaciones_analizadas: 0,
      };
    }

    console.log(
      `📊 ${asesor.name}: ${conversations.length} conversaciones encontradas`,
    );

    // 3. Análisis de ventas con IA híbrida
    const salesResults = [];
    let totalVentas = 0;
    let totalLeads = 0;
    let valorTotal = 0;

    for (const conversation of conversations) {
      try {
        // Obtener mensajes de la conversación
        const messages = await getConversationMessages(conversation.id);
        if (
          !messages ||
          messages.length < DAILY_ANALYSIS_CONFIG.minMessagesPerConversation
        ) {
          continue;
        }

        // Análisis híbrido (proceso + ventas)
        const analysis = await analyzeCompletePerformance(messages, {
          chat_id: conversation.id,
          contact_name: conversation.contact_name || conversation.name,
          contact_number: conversation.contact_number || conversation.chat_id,
        });

        if (analysis.success) {
          salesResults.push({
            conversation_id: conversation.id,
            ...analysis.evaluation,
            contact_name: conversation.contact_name || "Cliente",
            analysis_date: analysisDate,
          });

          // Acumular métricas
          if (analysis.evaluation.venta_confirmada) totalVentas++;
          if (analysis.evaluation.lead_caliente) totalLeads++;
          if (analysis.evaluation.valor_venta)
            valorTotal += analysis.evaluation.valor_venta;
        }
      } catch (convError) {
        console.error(
          `Error analizando conversación ${conversation.id}:`,
          convError,
        );
        // Continuar con la siguiente conversación
      }
    }

    // 4. Crear análisis de rendimiento
    const analysisData = {
      analysis_name: `Análisis Diario - ${asesor.name} - ${analysisDate}`,
      bot_id: asesor.id,
      worker_id: asesor.worker_id || null,
      analysis_date: analysisDate,
      total_conversations_analyzed: salesResults.length,
      generated_by: "DAILY_CRON",
      status: "finalized",
      // Agregar métricas de ventas
      ventas_confirmadas_count: totalVentas,
      leads_calientes_count: totalLeads,
      valor_total_ventas: valorTotal,
      tasa_conversion:
        salesResults.length > 0
          ? ((totalVentas / salesResults.length) * 100).toFixed(1)
          : 0,
      nivel_comercial: classifyCommercialLevel(
        totalVentas,
        salesResults.length,
      ),
      sales_summary: {
        total_conversations: salesResults.length,
        ventas_confirmadas: totalVentas,
        leads_calientes: totalLeads,
        valor_total: valorTotal,
        processed_at: new Date().toISOString(),
      },
    };

    // Calcular estadísticas tradicionales también
    const traditionalStats = calculateAnalysisStats(salesResults);
    Object.assign(analysisData, traditionalStats);

    const analysis = await createPerformanceAnalysis(analysisData);

    // 5. Guardar evaluaciones individuales
    if (salesResults.length > 0) {
      const evaluationsForDB = salesResults.map((result) => ({
        ...result,
        performance_analysis_id: analysis.id,
        bot_id: asesor.id,
        worker_id: asesor.worker_id || null,
        evaluation_date: new Date().toISOString(),
        generated_by: "DAILY_CRON",
      }));

      await saveMultipleEvaluations(evaluationsForDB);
    }

    // 6. Crear reporte diario en tabla específica
    await createDailySalesReport(asesor, analysisDate, {
      ventas_confirmadas: totalVentas,
      leads_calientes: totalLeads,
      conversaciones_analizadas: salesResults.length,
      valor_total_ventas: valorTotal,
      tasa_conversion: analysisData.tasa_conversion,
      nivel_rendimiento: analysisData.nivel_comercial,
      performance_analysis_id: analysis.id,
      sales_results: salesResults,
    });

    const processingTime = Date.now() - processingStart;
    console.log(
      `✅ ${asesor.name} completado en ${Math.round(processingTime / 1000)}s`,
    );

    return {
      success: true,
      asesor_id: asesor.id,
      conversaciones_analizadas: salesResults.length,
      ventas_confirmadas: totalVentas,
      leads_calientes: totalLeads,
      valor_total: valorTotal,
      processing_time_ms: processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - processingStart;
    console.error(`❌ Error procesando ${asesor.name}:`, error);

    await logAnalysisResult(
      "advisor_analysis_failed",
      {
        asesor_id: asesor.id,
        asesor_name: asesor.name,
        error: error.message,
        processing_time_ms: processingTime,
      },
      false,
    );

    throw error;
  }
}

// ============================================
// FUNCIONES DE CONFIGURACIÓN
// ============================================

/**
 * Inicializa el sistema de cron jobs
 */
export function initializeDailySalesAnalysis() {
  if (cronJobInstance) {
    console.log("⚠️ Cron job ya está inicializado");
    return;
  }

  console.log("🚀 Inicializando sistema de análisis diario automático...");
  console.log(
    `⏰ Configurado para ejecutar: ${DAILY_ANALYSIS_CONFIG.cronTime} (${DAILY_ANALYSIS_CONFIG.timezone})`,
  );

  cronJobInstance = cron.schedule(
    DAILY_ANALYSIS_CONFIG.cronTime,
    async () => {
      console.log("⏰ Ejecutando análisis diario programado...");
      await performDailySalesAnalysis();
    },
    {
      scheduled: false, // No iniciar automáticamente
      timezone: DAILY_ANALYSIS_CONFIG.timezone,
    },
  );

  // Iniciar el cron job
  cronJobInstance.start();
  console.log("✅ Sistema de análisis diario iniciado correctamente");
}

/**
 * Detiene el sistema de cron jobs
 */
export function stopDailySalesAnalysis() {
  if (cronJobInstance) {
    cronJobInstance.stop();
    cronJobInstance.destroy();
    cronJobInstance = null;
    console.log("🛑 Sistema de análisis diario detenido");
  }
}

/**
 * Obtiene el estado actual del sistema de cron
 */
export function getCronStatus() {
  return {
    is_initialized: cronJobInstance !== null,
    is_running: cronJobInstance?.running || false,
    is_analysis_running: isAnalysisRunning,
    last_analysis_result: lastAnalysisResult,
    configuration: DAILY_ANALYSIS_CONFIG,
  };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function getActiveAdvisors() {
  try {
    const allBots = await getAllBots();
    return allBots
      .filter(
        (bot) => !isBotExcluded(bot.session_name) && bot.status !== "offline",
      )
      .map((bot) => ({
        id: bot.id,
        name: parseBotSessionName(bot.session_name).fullName,
        session_name: bot.session_name,
        worker_id: bot.worker_id,
        status: bot.status,
      }));
  } catch (error) {
    console.error("Error obteniendo asesores activos:", error);
    throw error;
  }
}

async function getCronConfiguration() {
  try {
    const { data, error } = await supabase
      .from("sales_analysis_config")
      .select("config_value")
      .eq("config_key", "cron_settings")
      .single();

    if (error) throw error;
    return data?.config_value || { enabled: false };
  } catch (error) {
    console.error("Error obteniendo configuración:", error);
    return { enabled: false };
  }
}

async function checkExistingDailyAnalysis(asesorId, analysisDate) {
  try {
    const { data, error } = await supabase
      .from("daily_sales_reports")
      .select("id")
      .eq("asesor_id", asesorId)
      .eq("report_date", analysisDate)
      .single();

    return !error && data;
  } catch (error) {
    return false;
  }
}

async function createDailySalesReport(asesor, analysisDate, salesData) {
  const reportData = {
    asesor_id: asesor.id,
    worker_id: asesor.worker_id,
    report_date: analysisDate,
    ...salesData,
    requiere_seguimiento:
      salesData.leads_calientes > 0 || salesData.ventas_confirmadas > 0,
  };

  const { data, error } = await supabase
    .from("daily_sales_reports")
    .insert(reportData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createEmptyDailySalesReport(asesor, analysisDate) {
  return await createDailySalesReport(asesor, analysisDate, {
    ventas_confirmadas: 0,
    leads_calientes: 0,
    conversaciones_analizadas: 0,
    valor_total_ventas: 0,
    tasa_conversion: 0,
    nivel_rendimiento: "SIN_DATOS",
  });
}

function classifyCommercialLevel(ventas, totalConversaciones) {
  if (totalConversaciones === 0) return "SIN_DATOS";

  const conversionRate = (ventas / totalConversaciones) * 100;

  if (conversionRate >= 20) return "EXCELENTE";
  if (conversionRate >= 10) return "BUENO";
  if (conversionRate >= 5) return "REGULAR";
  return "DEFICIENTE";
}

async function logAnalysisResult(eventType, eventData, success) {
  try {
    await supabase.from("sales_analysis_logs").insert({
      event_type: eventType,
      event_data: eventData,
      success: success,
      execution_time_ms: eventData.execution_time_ms || null,
    });
  } catch (error) {
    console.error("Error guardando log:", error);
  }
}

async function sendSalesNotification(asesor, salesData) {
  // TODO: Implementar notificaciones por email/WhatsApp
  console.log(
    `📢 Notificación: ${asesor.name} realizó ${salesData.ventas_confirmadas} ventas por $${salesData.valor_total}`,
  );
}

async function generateConsolidatedReport(results, analysisDate) {
  // TODO: Generar reporte consolidado del día
  console.log(
    `📊 Reporte consolidado ${analysisDate}: ${results.ventas_totales} ventas, $${results.valor_total}`,
  );
}

async function getConversationMessages(conversationId) {
  // TODO: Implementar función para obtener mensajes
  // Por ahora usar la función existente
  try {
    const response = await fetch(`/api/get-messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: conversationId, limit: 50 }),
    });

    if (response.ok) {
      const { messages } = await response.json();
      return messages;
    }
    return [];
  } catch (error) {
    console.error(`Error obteniendo mensajes para ${conversationId}:`, error);
    return [];
  }
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================
// EXPORTACIONES
// ============================================

export { DAILY_ANALYSIS_CONFIG };
