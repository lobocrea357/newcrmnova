/**
 * Funciones avanzadas para cargar y filtrar conversaciones
 * Integra Supabase + filtros estructurales inteligentes
 */

import { supabase } from "./supabase";
import { applyStructuralFilters, isValidChat } from "./chatFilters";
import { NEXT_CONVERSACIONES_API } from "@/config/apiConfig";

/**
 * Carga conversaciones con filtrado inteligente integrado
 * CON COMPENSACIÓN: Si muchas conversaciones son grupos/internas, sigue buscando hasta alcanzar el target
 * @param {string} botId - ID del bot
 * @param {Object} options - Opciones de carga y filtrado
 * @returns {Promise<Object>} - {conversations, stats}
 */
export async function loadConversationsForAnalysis(botId, options = {}) {
  const {
    limit = 100,
    targetValid = 20, // Objetivo: obtener al menos 20 conversaciones válidas
    maxAttempts = 500, // Máximo de conversaciones a revisar
    excludeGroups = true,
    excludeInternal = true,
    useCache = true,
    minLastMessageDays = 30,
  } = options;

  console.log(`🔍 Cargando conversaciones para análisis - Bot: ${botId}`);
  console.log(`   Objetivo: ${targetValid} conversaciones válidas`);

  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - minLastMessageDays);

    let allValidConversations = [];
    let offset = 0;
    let totalProcessed = 0;
    const batchSize = 50;

    const globalStats = {
      total_loaded: 0,
      excluded_groups: 0,
      excluded_internal: 0,
      excluded_cache: 0,
      passed: 0,
    };

    // COMPENSACIÓN: Seguir cargando hasta tener suficientes conversaciones válidas
    while (
      allValidConversations.length < targetValid &&
      totalProcessed < maxAttempts
    ) {
      console.log(
        `   📦 Cargando batch ${Math.floor(offset / batchSize) + 1} (offset: ${offset})`,
      );

      // Cargar batch desde Supabase
      let query = supabase.from("chats").select("*").eq("bot_id", botId);

      // Filtrar grupos a nivel SQL
      if (excludeGroups) {
        query = query.eq("is_group", false);
      }

      if (minLastMessageDays > 0) {
        query = query.gte("last_message_at", dateLimit.toISOString());
      }

      // Excluir patrones obvios de WhatsApp
      query = query
        .not("chat_id", "ilike", "%status%")
        .not("chat_id", "ilike", "%@broadcast%")
        .not("chat_id", "ilike", "%@g.us");

      query = query
        .order("last_message_at", { ascending: false })
        .range(offset, offset + batchSize - 1);

      const { data: chats, error } = await query;

      if (error) {
        console.error("❌ Error cargando conversaciones:", error);
        throw error;
      }

      if (!chats || chats.length === 0) {
        console.log("   ⚠️ No hay más conversaciones disponibles");
        break;
      }

      globalStats.total_loaded += chats.length;
      totalProcessed += chats.length;

      // Aplicar filtros estructurales con manejo de errores
      let filtered = [];
      let stats = { excluded_groups: 0, excluded_internal: 0, excluded_cache: 0, passed: 0 };
      
      try {
        const result = applyStructuralFilters(chats, {
          excludeGroups,
          excludeInternal,
          useCache,
        });
        filtered = result.filtered || [];
        stats = result.stats || stats;
      } catch (error) {
        console.error("Error aplicando filtros estructurales:", error);
        // Si falla el filtrado, validar formato antes de usar chats sin filtrar
        filtered = chats.filter(isValidChat);
        console.warn("⚠️ Usando chats sin filtrar estructural (validación básica aplicada)");
      }

      // Acumular estadísticas
      globalStats.excluded_groups += stats.excluded_groups;
      globalStats.excluded_internal += stats.excluded_internal;
      globalStats.excluded_cache += stats.excluded_cache;
      globalStats.passed += stats.passed;

      // Validar formato
      const validInBatch = filtered.filter(isValidChat);
      allValidConversations.push(...validInBatch);

      console.log(
        `   ✅ Batch: ${validInBatch.length} válidas | Total acumulado: ${allValidConversations.length}/${targetValid}`,
      );

      // Si ya tenemos suficientes, detener
      if (allValidConversations.length >= targetValid) {
        break;
      }

      offset += batchSize;
    }

    // Limitar al objetivo si tenemos más
    const finalConversations = allValidConversations.slice(0, targetValid);

    console.log(`\n✅ RESULTADO FINAL:`);
    console.log(`   • Conversaciones procesadas: ${totalProcessed}`);
    console.log(`   • Grupos excluidos: ${globalStats.excluded_groups}`);
    console.log(
      `   • Chats internos excluidos: ${globalStats.excluded_internal}`,
    );
    console.log(
      `   • Conversaciones válidas obtenidas: ${finalConversations.length}/${targetValid}`,
    );

    return {
      conversations: finalConversations,
      stats: {
        ...globalStats,
        total_processed: totalProcessed,
        valid_final: finalConversations.length,
        target_reached: finalConversations.length >= targetValid,
      },
    };
  } catch (error) {
    console.error("❌ Error en loadConversationsForAnalysis:", error);
    throw error;
  }
}

/**
 * Verifica si un chat tiene mensajes suficientes
 * @param {string} chatId - ID del chat
 * @param {number} minMessages - Mínimo de mensajes requeridos
 * @returns {Promise<boolean>}
 */
export async function hasEnoughMessages(chatId, minMessages = 5) {
  try {
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", chatId);

    if (error) {
      console.error("Error contando mensajes:", error);
      return false;
    }

    return (count || 0) >= minMessages;
  } catch (error) {
    console.error("Error en hasEnoughMessages:", error);
    return false;
  }
}

/**
 * Filtra conversaciones que tengan mensajes suficientes (más costoso)
 * @param {Array} conversations - Array de conversaciones
 * @param {number} minMessages - Mínimo de mensajes
 * @returns {Promise<Array>} - Conversaciones filtradas
 */
export async function filterByMessageCount(conversations, minMessages = 5) {
  console.log(
    `🔍 Filtrando ${conversations.length} chats por cantidad de mensajes (min: ${minMessages})`,
  );

  const results = await Promise.all(
    conversations.map(async (conv) => {
      const hasEnough = await hasEnoughMessages(conv.id, minMessages);
      return hasEnough ? conv : null;
    }),
  );

  const filtered = results.filter((conv) => conv !== null);
  console.log(`✅ ${filtered.length} chats tienen suficientes mensajes`);

  return filtered;
}

/**
 * Obtiene mensajes de un chat para análisis
 * Usa API route server-side para evitar CORS/RLS issues
 * @param {string} chatUuid - UUID del chat en tabla chats
 * @param {string} chatWhatsAppId - Chat ID de WhatsApp (formato: 123456@c.us)
 * @param {number} limit - Límite de mensajes a obtener
 * @returns {Promise<Array>} - Mensajes del chat
 */
export async function getMessagesForAnalysis(
  chatUuid,
  limit = 30,
  chatWhatsAppId = null,
) {
  try {
    console.log(
      `   📝 getMessagesForAnalysis: UUID=${chatUuid?.slice(0, 8)}, WhatsAppID=${chatWhatsAppId}`,
    );

    const response = await fetch(NEXT_CONVERSACIONES_API.getMessages, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: chatUuid,
        chatWhatsAppId: chatWhatsAppId,
        limit: limit,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Error desconocido" }));
      console.error("Error obteniendo mensajes:", errorData);
      return [];
    }

    const result = await response.json();
    console.log(
      `   ✓ API retornó ${result.count || 0} mensajes (total en BD: ${result.totalInDb || 0})`,
    );
    return result.messages || [];
  } catch (error) {
    console.error("Error en getMessagesForAnalysis:", error);
    return [];
  }
}
