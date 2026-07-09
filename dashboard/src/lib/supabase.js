import { createClient } from "@supabase/supabase-js";
import { isOtherBot } from "./botNameParser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Helper function to handle authentication errors gracefully
 */
export async function handleAuthError(error) {
  if (
    error?.message?.includes("Auth session missing") ||
    error?.name === "AuthSessionMissingError"
  ) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return;
  }

  if (
    error?.message?.includes("Invalid Refresh Token") ||
    error?.message?.includes("refresh_token_not_found") ||
    error?.message?.includes("JWT expired")
  ) {
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.warn("Error al cerrar sesión inválida:", signOutError);
    }

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw new Error("Session expired. Please log in again.");
  }
  throw error;
}

/**
 * Enhanced session check with error handling
 */
export async function getValidSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      await handleAuthError(error);
    }

    if (!session) {
      throw new Error("No active session");
    }

    return session;
  } catch (error) {
    await handleAuthError(error);
  }
}

/**
 * Enhanced user check with error handling
 */
export async function getValidUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      await handleAuthError(error);
    }

    if (!user) {
      throw new Error("No authenticated user");
    }

    return user;
  } catch (error) {
    await handleAuthError(error);
  }
}

/**
 * Obtiene todos los workers con sus estadísticas
 */
export async function getAllWorkers() {
  const { data: workers, error } = await supabase
    .from("workers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener workers:", error);
    return [];
  }

  // Obtener estadísticas para cada worker
  const workersWithStats = await Promise.all(
    (workers || []).map(async (worker) => {
      const { count: botCount } = await supabase
        .from("bots")
        .select("*", { count: "exact", head: true })
        .eq("worker_id", worker.id);

      const { count: chatCount } = await supabase
        .from("chats")
        .select("*", { count: "exact", head: true })
        .in(
          "bot_id",
          await supabase
            .from("bots")
            .select("id")
            .eq("worker_id", worker.id)
            .then(({ data }) => data?.map((b) => b.id) || []),
        );

      return {
        worker_id: worker.id,
        worker_name: worker.name,
        worker_email: worker.email,
        worker_status: worker.status,
        total_bots: botCount || 0,
        total_chats: chatCount || 0,
      };
    }),
  );

  return workersWithStats;
}

/**
 * Enriquece una lista de bots con conteo de conversaciones y última actividad
 */
async function enrichBotsWithStats(bots = []) {
  // OPTIMIZADO: Obtener estadísticas de todos los bots en paralelo
  const botsWithDetails = await Promise.all(
    (bots || []).map(async (bot) => {
      // Ejecutar count y recentChat en paralelo en lugar de secuencial
      // Usamos filtro AND combinado para evitar error 406
      const [countResult, recentChatResult] = await Promise.all([
        // Contar chats válidos (filtro combinado - MISMO que getConversationsByBot)
        supabase
          .from("chats")
          .select("*", { count: "exact", head: true })
          .eq("bot_id", bot.id)
          .eq("is_group", false)
          .not("chat_id", "ilike", "%status%")
          .not("chat_id", "ilike", "%@broadcast%")
          .not("chat_id", "ilike", "%@g.us"),

        // Obtener última actividad (sin doble order para evitar 406)
        supabase
          .from("chats")
          .select("last_message_time, updated_at, created_at")
          .eq("bot_id", bot.id)
          .eq("is_group", false)
          .not("chat_id", "ilike", "%status%")
          .not("chat_id", "ilike", "%@broadcast%")
          .not("chat_id", "ilike", "%@g.us")
          .order("last_message_time", { ascending: false, nullsLast: true })
          .limit(1)
          .maybeSingle(),
      ]);

      const validChatsCount = countResult.count || 0;
      const recentChat = recentChatResult.data;
      const lastActivity =
        recentChat?.last_message_time ||
        recentChat?.updated_at ||
        recentChat?.created_at ||
        bot.created_at;

      return {
        ...bot,
        worker: bot.worker || null,
        conversation_count: validChatsCount || 0,
        last_activity: lastActivity,
        last_activity_date: lastActivity
          ? new Date(lastActivity)
          : new Date(bot.created_at),
      };
    }),
  );

  // Ordenar por actividad reciente (más recientes primero)
  const sortedBots = botsWithDetails.sort((a, b) => {
    // Primero por estado (activos primero)
    if (a.status === "WORKING" && b.status !== "WORKING") return -1;
    if (b.status === "WORKING" && a.status !== "WORKING") return 1;

    // Luego por fecha de última actividad (más reciente primero)
    return b.last_activity_date - a.last_activity_date;
  });

  return sortedBots;
}

/**
 * Obtiene todos los bots con el conteo de conversaciones
 */
export async function getAllBots() {
  try {
    await getValidSession();
  } catch (error) {
    console.error("❌ Error de autenticación:", error);
    throw error;
  }

  // OPTIMIZADO: Obtener bots con workers en una sola query usando JOIN
  const { data: bots, error } = await supabase
    .from("bots")
    .select(
      `
      *,
      worker:workers(id, name, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener bots:", error);
    return [];
  }

  return enrichBotsWithStats(bots);
}

/**
 * Obtiene bots del dashboard principal (excluye sesiones _other)
 */
export async function getMainBots() {
  const allBots = await getAllBots();
  return allBots.filter((bot) => !isOtherBot(bot.session_name));
}

/**
 * Obtiene bots del dashboard "other" (solo sesiones _other)
 */
export async function getOtherBots() {
  const allBots = await getAllBots();
  return allBots.filter((bot) => isOtherBot(bot.session_name));
}

/**
 * Obtiene los bots de un worker específico
 */
export async function getBotsByWorker(workerId) {
  const { data, error } = await supabase
    .from("bots")
    .select(
      `
      *,
      chats:chats(count)
    `,
    )
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener bots por worker:", error);
    return [];
  }

  return (data || []).map((bot) => ({
    ...bot,
    conversation_count: bot.chats?.[0]?.count || 0,
  }));
}

/**
 * Cuenta el total de cotizaciones (PDFs) enviadas por un bot
 * OPTIMIZADO: Usa conversation_metrics en lugar de escanear mensajes
 * @param {string} botId - ID del bot
 * @returns {Promise<number>} Total de cotizaciones
 * @deprecated Usar getAllBotsCotizacionesCount para evitar N+1 queries
 */
export async function getBotCotizacionesCount(botId) {
  try {
    // Obtener suma de cotizaciones desde métricas precalculadas
    const { data, error } = await supabase
      .from("chats")
      .select(`
        metrics:conversation_metrics(cotizacion_mentions_count)
      `)
      .eq("bot_id", botId)
      .eq("is_group", false)
      .not("chat_id", "ilike", "%status%")
      .not("chat_id", "ilike", "%@broadcast%")
      .not("chat_id", "ilike", "%@g.us");

    if (error || !data) {
      console.error("Error contando cotizaciones:", error);
      return 0;
    }

    // Sumar cotizaciones de todas las conversaciones
    const totalCotizaciones = data.reduce((sum, chat) => {
      const count = chat.metrics?.[0]?.cotizacion_mentions_count || 0;
      return sum + count;
    }, 0);

    return totalCotizaciones;
  } catch (error) {
    console.error("Error contando cotizaciones:", error);
    return 0;
  }
}

/**
 * Obtiene el conteo de cotizaciones para TODOS los bots en una sola query
 * OPTIMIZADO: Evita N+1 queries al cargar cotizaciones por bot
 * @returns {Promise<Object>} Objeto { botId: count, ... }
 */
export async function getAllBotsCotizacionesCount() {
  try {
    const { data, error } = await supabase
      .from("chats")
      .select(`
        bot_id,
        metrics:conversation_metrics(cotizacion_mentions_count)
      `)
      .eq("is_group", false)
      .not("chat_id", "ilike", "%status%")
      .not("chat_id", "ilike", "%@broadcast%")
      .not("chat_id", "ilike", "%@g.us");

    if (error || !data) {
      console.error("Error obteniendo cotizaciones agregadas:", error);
      return {};
    }

    // Agrupar y sumar por bot_id
    const cotizacionesPorBot = {};
    data.forEach((chat) => {
      const botId = chat.bot_id;
      const count = chat.metrics?.[0]?.cotizacion_mentions_count || 0;
      if (botId) {
        cotizacionesPorBot[botId] = (cotizacionesPorBot[botId] || 0) + count;
      }
    });

    return cotizacionesPorBot;
  } catch (error) {
    console.error("Error obteniendo cotizaciones agregadas:", error);
    return {};
  }
}

// Bots excluidos (prueba/testing - no son asesores reales)
const EXCLUDED_BOT_PATTERNS = ["abraham", "abrahama", "paul", "hernandez"];

const PAYMENT_KEYWORDS = [
  "pago",
  "pagos",
  "pagar",
  "metodo de pago",
  "metodos de pago",
  "tarjeta",
  "transferencia",
  "efectivo",
  "deposito",
  "depósito",
  "zelle",
  "abono",
  "cuota",
  "pse",
  "paypal",
];

const normalizedPaymentKeywords = PAYMENT_KEYWORDS.map((keyword) =>
  keyword
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""),
);

const normalizeText = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Verificar si un bot debe ser excluido (testing/prueba)
export const isBotExcluded = (sessionName = "") => {
  const normalized = normalizeText(sessionName);
  return EXCLUDED_BOT_PATTERNS.some((pattern) => normalized.includes(pattern));
};

function analyzeConversationMetrics(messages = []) {
  if (!messages?.length) return null;

  const responseTimes = [];
  let lastClientMessageTime = null;

  messages.forEach((msg) => {
    if (!msg?.timestamp) return;
    const timestamp = new Date(msg.timestamp).getTime();

    if (!msg.from_me) {
      lastClientMessageTime = timestamp;
      return;
    }

    if (msg.from_me && lastClientMessageTime) {
      const diffMinutes = (timestamp - lastClientMessageTime) / (1000 * 60);
      if (diffMinutes >= 0 && diffMinutes < 60 * 24 * 7) {
        responseTimes.push(diffMinutes);
      }
      lastClientMessageTime = null;
    }
  });

  const responseMetrics = responseTimes.length
    ? {
        averageMinutes: Number(
          (
            responseTimes.reduce((sum, value) => sum + value, 0) /
            responseTimes.length
          ).toFixed(1),
        ),
        maxMinutes: Number(Math.max(...responseTimes).toFixed(1)),
        samples: responseTimes.length,
      }
    : null;

  const paymentMentions = {
    count: 0,
    lastTimestamp: null,
    lastFromMe: null,
    lastSnippet: null,
    firstTimestamp: null,
  };

  messages.forEach((msg) => {
    const rawBody = msg.body || msg.content || "";
    if (!rawBody) return;

    const normalizedBody = normalizeText(rawBody);
    const containsPaymentKeyword = normalizedPaymentKeywords.some((keyword) =>
      normalizedBody.includes(keyword),
    );

    if (containsPaymentKeyword) {
      paymentMentions.count += 1;
      const timestamp = msg.timestamp
        ? new Date(msg.timestamp).toISOString()
        : null;

      if (!paymentMentions.firstTimestamp) {
        paymentMentions.firstTimestamp = timestamp;
      }
      paymentMentions.lastTimestamp = timestamp;
      paymentMentions.lastFromMe = !!msg.from_me;
      paymentMentions.lastSnippet = rawBody.substring(0, 120);
    }
  });

  // Detectar PDFs de cotización
  const cotizacionMentions = {
    count: 0,
    files: [],
  };
  const pdfPattern = /Cotizacion_[A-Z_]+_\d{4}-\d{2}-\d{2}\.pdf/g;

  messages.forEach((msg) => {
    const rawBody = msg.body || msg.content || "";
    if (!rawBody) return;

    const matches = rawBody.match(pdfPattern);
    if (matches) {
      cotizacionMentions.count += matches.length;
      cotizacionMentions.files.push(...matches);
    }
  });

  return {
    response: responseMetrics,
    paymentMentions: paymentMentions.count > 0 ? paymentMentions : null,
    cotizacionMentions: cotizacionMentions.count > 0 ? cotizacionMentions : null,
  };
}

/**
 * Obtiene las conversaciones de un bot específico con paginación
 * OPTIMIZADO: Usa tabla conversation_metrics para evitar N+1 queries
 * @param {string} botId - ID del bot
 * @param {number} page - Número de página (empezando en 1)
 * @param {number} pageSize - Cantidad de conversaciones por página (default: 10)
 * @returns {Promise<{data: Array, total: number, totalPages: number, currentPage: number}>}
 */
export async function getConversationsByBot(botId, page = 1, pageSize = 10) {
  // Contar total de conversaciones
  const { count: totalCount, error: countError } = await supabase
    .from("chats")
    .select("*", { count: "exact", head: true })
    .eq("bot_id", botId)
    .eq("is_group", false)
    .not("chat_id", "ilike", "%status%")
    .not("chat_id", "ilike", "%@broadcast%")
    .not("chat_id", "ilike", "%@g.us");

  if (countError) {
    console.error("❌ Error al contar conversaciones:", countError);
    return { data: [], total: 0, totalPages: 0, currentPage: page };
  }

  const total = totalCount || 0;
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // OPTIMIZADO: Query única con JOIN a conversation_metrics
  const { data, error } = await supabase
    .from("chats")
    .select(`
      *,
      contact:contacts(id, name, phone_number, profile_picture_url, push_name),
      metrics:conversation_metrics(
        total_messages,
        avg_response_time_minutes,
        max_response_time_minutes,
        response_samples,
        payment_mentions_count,
        payment_first_mention_at,
        payment_last_mention_at,
        payment_last_from_me,
        cotizacion_mentions_count,
        cotizacion_files
      )
    `)
    .eq("bot_id", botId)
    .eq("is_group", false)
    .not("chat_id", "ilike", "%status%")
    .not("chat_id", "ilike", "%@broadcast%")
    .not("chat_id", "ilike", "%@g.us")
    .order("last_message_time", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) {
    console.error("❌ Error al obtener conversaciones:", error);
    return { data: [], total: 0, totalPages: 0, currentPage: page };
  }

  if (!data || data.length === 0) {
    return { data: [], total, totalPages, currentPage: page };
  }

  // Procesar conversaciones con métricas precalculadas (sin N+1 queries)
  const conversationsWithDetails = data.map((chat) => {
    // Determinar nombre de contacto
    let displayName = "Sin nombre";
    let displayPhone = "";
    let isValidContact = false;

    if (chat.contact?.name && chat.contact.name.trim() !== "") {
      displayName = chat.contact.name.trim();
      displayPhone = chat.contact.phone_number || chat.contact_number || "";
      isValidContact = true;
    } else if (chat.contact?.push_name && chat.contact.push_name.trim() !== "") {
      displayName = chat.contact.push_name.trim();
      displayPhone = chat.contact.phone_number || chat.contact_number || "";
      isValidContact = true;
    } else if (chat.name && chat.name.trim() !== "") {
      displayName = chat.name.trim();
      displayPhone = chat.contact?.phone_number || chat.contact_number || "";
      isValidContact = true;
    } else if (chat.contact_name && chat.contact_name.trim() !== "") {
      displayName = chat.contact_name.trim();
      displayPhone = chat.contact_number || "";
      isValidContact = true;
    } else if (chat.contact?.phone_number) {
      displayName = chat.contact.phone_number;
      displayPhone = chat.contact.phone_number;
      isValidContact = true;
    } else if (chat.contact_number) {
      displayName = chat.contact_number;
      displayPhone = chat.contact_number;
      isValidContact = true;
    } else if (chat.chat_id) {
      const phoneFromChatId = chat.chat_id.split("@")[0];
      if (phoneFromChatId && phoneFromChatId !== "status") {
        displayName = phoneFromChatId;
        displayPhone = phoneFromChatId;
        isValidContact = true;
      }
    }

    // Construir métricas usando datos precalculados
    const metrics = chat.metrics?.[0];
    const conversationMetrics = metrics ? {
      response: metrics.response_samples > 0 ? {
        averageMinutes: Number(metrics.avg_response_time_minutes?.toFixed(1) || 0),
        maxMinutes: Number(metrics.max_response_time_minutes?.toFixed(1) || 0),
        samples: metrics.response_samples
      } : null,
      paymentMentions: metrics.payment_mentions_count > 0 ? {
        count: metrics.payment_mentions_count,
        firstTimestamp: metrics.payment_first_mention_at,
        lastTimestamp: metrics.payment_last_mention_at,
        lastFromMe: metrics.payment_last_from_me
      } : null,
      cotizacionMentions: metrics.cotizacion_mentions_count > 0 ? {
        count: metrics.cotizacion_mentions_count,
        files: metrics.cotizacion_files || []
      } : null
    } : null;

    return {
      ...chat,
      message_count: metrics?.total_messages || 0,
      contact_name: displayName,
      contact_phone: displayPhone,
      contact_profile_picture_url: chat.contact?.profile_picture_url || null,
      last_message_preview: chat.last_message?.substring(0, 100) || "",
      last_message_timestamp: chat.last_message_time || chat.updated_at,
      last_message_from_me: chat.last_message_from_me || false,
      is_valid_contact: isValidContact,
      conversation_metrics: conversationMetrics
    };
  });

  return {
    data: conversationsWithDetails,
    total: total,
    totalPages: totalPages,
    currentPage: page
  };
}

/**
 * Obtiene mensajes paginados de una conversación (para virtualización)
 * Carga los últimos N mensajes, soporta paginación hacia atrás
 * @param {string} chatId - ID del chat
 * @param {number} limit - Cantidad de mensajes a cargar (default: 50)
 * @param {string} beforeTimestamp - Timestamp para cargar mensajes anteriores (opcional)
 * @returns {Promise<{messages: Array, hasMore: boolean, totalMessages: number}>}
 */
export async function getPaginatedMessages(
  chatId,
  limit = 50,
  beforeTimestamp = null,
) {
  // Contar total de mensajes
  const { count: totalMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("chat_id", chatId);

  // Construir query para mensajes (SIN media_files JOIN para evitar timeout)
  let query = supabase
    .from("messages")
    .select(
      `
      id,
      body,
      content,
      type,
      from_me,
      timestamp,
      has_media,
      media_url,
      media_mimetype,
      metadata
    `,
    )
    .eq("chat_id", chatId)
    .order("timestamp", { ascending: false }); // Más recientes primero

  // Si hay beforeTimestamp, cargar mensajes anteriores a ese timestamp
  if (beforeTimestamp) {
    query = query.lt("timestamp", beforeTimestamp);
  }

  query = query.limit(limit);

  const { data: messages, error } = await query;

  if (error) {
    console.error("❌ Error al cargar mensajes paginados:", error);
    return { messages: [], hasMore: false, totalMessages: 0 };
  }

  // Invertir para que estén en orden cronológico (más antiguos primero)
  const sortedMessages = (messages || []).reverse();

  // Batch-load media_files para mensajes con has_media=true
  const mediaMessageIds = sortedMessages
    .filter((m) => m.has_media)
    .map((m) => m.id);

  if (mediaMessageIds.length > 0) {
    const { data: mediaFiles, error: mediaError } = await supabase
      .from("media_files")
      .select("*")
      .in("message_id", mediaMessageIds);

    if (!mediaError && mediaFiles) {
      const mediaByMessage = {};
      mediaFiles.forEach((mf) => {
        if (!mediaByMessage[mf.message_id]) mediaByMessage[mf.message_id] = [];
        mediaByMessage[mf.message_id].push(mf);
      });
      sortedMessages.forEach((msg) => {
        if (mediaByMessage[msg.id]) {
          msg.media_files = mediaByMessage[msg.id];
        }
      });
    }
  }

  // Determinar si hay más mensajes (fix: considerar total real, no solo si devolvió limit)
  const loadedCount = sortedMessages.length;
  const oldestLoadedTimestamp = sortedMessages[0]?.timestamp;
  
  // hasMore es true solo si: cargamos el límite completo Y hay mensajes más antiguos
  let hasMore = false;
  if (loadedCount === limit && oldestLoadedTimestamp) {
    // Verificar si hay mensajes anteriores al más antiguo cargado
    const { count: olderCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", chatId)
      .lt("timestamp", oldestLoadedTimestamp);
    hasMore = (olderCount || 0) > 0;
  }

  return {
    messages: sortedMessages,
    hasMore,
    totalMessages: totalMessages || 0,
  };
}

/**
 * Obtiene una conversación con sus mensajes (optimizado para evitar timeouts)
 * OPTIMIZADO: Carga mensajes de forma eficiente evitando timeouts
 * @param {string} chatId - ID del chat
 * @param {number} batchSize - Tamaño de lote para cargar mensajes (default: 1000)
 * @returns {Promise<{conversation: Object, messages: Array, totalMessages: number}>}
 */
export async function getConversationWithMessages(chatId, batchSize = 10000) {
  // Primero contar total de mensajes en este chat
  const { count: totalMessages, error: countError } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("chat_id", chatId);

  if (countError) {
    console.error("❌ Error al contar mensajes:", countError);
  }

  // Obtener información del chat
  const { data: chatData, error: chatError } = await supabase
    .from("chats")
    .select(
      `
      *,
      bot:bots(*),
      contact:contacts(*)
    `,
    )
    .eq("id", chatId)
    .single();

  if (chatError) {
    console.error("❌ Error al obtener conversación:", chatError);
    return null;
  }

  // Determinar nombre del contacto para la conversación
  let contactName = "Sin nombre";
  if (chatData.contact?.name) {
    contactName = chatData.contact.name;
  } else if (chatData.contact?.push_name) {
    contactName = chatData.contact.push_name;
  } else if (chatData.name) {
    contactName = chatData.name;
  } else if (chatData.contact_name) {
    contactName = chatData.contact_name;
  } else if (chatData.contact_number) {
    contactName = chatData.contact_number;
  } else if (chatData.chat_id) {
    contactName = chatData.chat_id.split("@")[0];
  }

  // Obtener mensajes de forma optimizada (sin media_files para evitar timeout)
  let allMessages = [];
  let hasError = false;

  try {
    // CONSULTA SIMPLIFICADA - Solo campos esenciales (SIN media_files para evitar timeout)
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(
        `
        id,
        body,
        content,
        type,
        from_me,
        timestamp,
        has_media,
        media_url,
        media_mimetype,
        metadata
      `,
      )
      .eq("chat_id", chatId)
      .order("timestamp", { ascending: true });

    if (messagesError) {
      console.warn("⚠️ Error al obtener mensajes:", messagesError.message);
      hasError = true;
    } else {
      allMessages = messages || [];
    }
  } catch (error) {
    console.warn("⚠️ Error en consulta:", error);
    hasError = true;
  }

  // Si hay error, intentar consulta más básica
  if (hasError || allMessages.length === 0) {
    try {
      const { data: basicMessages, error: basicError } = await supabase
        .from("messages")
        .select("id, body, content, from_me, timestamp, type")
        .eq("chat_id", chatId)
        .order("timestamp", { ascending: true })
        .limit(batchSize); // Usar el mismo límite

      if (basicError) {
        console.error("❌ Error en consulta básica:", basicError.message);
        allMessages = [];
      } else {
        allMessages = basicMessages || [];
      }
    } catch (basicError) {
      console.error("❌ Error crítico:", basicError);
      allMessages = [];
    }
  }

  // Estadísticas detalladas
  const incomingCount = allMessages.filter((m) => !m.from_me).length;
  const outgoingCount = allMessages.filter((m) => m.from_me).length;
  const mediaCount = allMessages.filter(
    (m) => m.has_media || m.media_url,
  ).length;

  // Procesar mensajes para mejor visualización
  const processedMessages = allMessages.map((msg) => ({
    ...msg,
    // Asegurar que el body no sea null/undefined
    body: msg.body || msg.content || "",
    // Formatear timestamp
    formatted_timestamp: new Date(msg.timestamp).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    // Indicar si tiene multimedia
    has_multimedia: !!(msg.has_media || msg.media_url),
    // Tipo de mensaje más descriptivo
    message_type_display: msg.from_me
      ? "Enviado por Bot"
      : `Recibido de ${contactName}`,
  }));

  return {
    conversation: {
      ...chatData,
      contact_name: contactName,
    },
    messages: processedMessages,
    totalMessages: totalMessages || 0,
    loadedMessages: allMessages.length,
    isPartial: allMessages.length < (totalMessages || 0),
    stats: {
      incoming: incomingCount,
      outgoing: outgoingCount,
      media: mediaCount,
      total: allMessages.length,
    },
  };
}

/**
 * Búsqueda global de chats/conversaciones
 * Busca por nombre de contacto, número de teléfono o palabras clave en mensajes
 * @param {string} searchQuery - Texto de búsqueda
 * @param {number} limit - Límite de resultados (default: 50)
 * @returns {Promise<Array>} Array de chats que coinciden con la búsqueda
 */
export async function globalSearchChats(searchQuery, limit = 50) {
  if (!searchQuery || searchQuery.trim() === "") {
    return [];
  }

  const query = searchQuery.trim().toLowerCase();

  try {
    // Buscar en chats por nombre de contacto o número de teléfono
    // Excluir estados y canales de WhatsApp
    const { data: chatsData, error: chatsError } = await supabase
      .from("chats")
      .select(
        `
        *,
        bot:bots(id, session_name, phone_number, status),
        contact:contacts(id, name, phone_number, profile_picture_url)
      `,
      )
      .or(
        `contact_name.ilike.%${query}%,contact_number.ilike.%${query}%,name.ilike.%${query}%,chat_id.ilike.%${query}%`,
      )
      .not("chat_id", "ilike", "%status%")
      .not("chat_id", "ilike", "%@broadcast%")
      .limit(limit);

    if (chatsError) {
      console.error("❌ Error en búsqueda de chats:", chatsError);
    }

    // Buscar en contactos directamente
    const { data: contactsData, error: contactsError } = await supabase
      .from("contacts")
      .select(
        `
        id,
        name,
        phone_number,
        profile_picture_url,
        bot_id
      `,
      )
      .or(`name.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .limit(limit);

    if (contactsError) {
      console.error("❌ Error en búsqueda de contactos:", contactsError);
    }

    // Si encontramos contactos, buscar sus chats
    let chatsFromContacts = [];
    if (contactsData && contactsData.length > 0) {
      const contactIds = contactsData.map((c) => c.id);
      const { data: relatedChats } = await supabase
        .from("chats")
        .select(
          `
          *,
          bot:bots(id, session_name, phone_number, status),
          contact:contacts(id, name, phone_number, profile_picture_url)
        `,
        )
        .in("contact_id", contactIds);

      chatsFromContacts = relatedChats || [];
    }

    // Buscar en mensajes por contenido (palabra clave)
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select(
        `
        chat_id,
        body,
        timestamp
      `,
      )
      .ilike("body", `%${query}%`)
      .order("timestamp", { ascending: false })
      .limit(100);

    if (messagesError) {
      console.error("❌ Error en búsqueda de mensajes:", messagesError);
    }

    // Crear un mapa de chat_id -> último mensaje que coincide
    const messageMatchMap = new Map();
    if (messagesData && messagesData.length > 0) {
      messagesData.forEach((message) => {
        if (!messageMatchMap.has(message.chat_id)) {
          messageMatchMap.set(message.chat_id, {
            body: message.body,
            timestamp: message.timestamp,
          });
        }
      });
    }

    // Si encontramos mensajes, obtener sus chats únicos
    let chatsFromMessages = [];
    if (messagesData && messagesData.length > 0) {
      const uniqueChatIds = [...new Set(messagesData.map((m) => m.chat_id))];
      const { data: relatedChats } = await supabase
        .from("chats")
        .select(
          `
          *,
          bot:bots(id, session_name, phone_number, status),
          contact:contacts(id, name, phone_number, profile_picture_url)
        `,
        )
        .in("id", uniqueChatIds)
        .not("chat_id", "ilike", "%status%")
        .not("chat_id", "ilike", "%@broadcast%");

      chatsFromMessages = relatedChats || [];
    }

    // Combinar todos los resultados y eliminar duplicados
    const allChats = [
      ...(chatsData || []),
      ...chatsFromContacts,
      ...chatsFromMessages,
    ];

    // Eliminar duplicados por ID y agregar información de coincidencia
    const uniqueChatsMap = new Map();
    allChats.forEach((chat) => {
      if (!uniqueChatsMap.has(chat.id)) {
        // Verificar si hay coincidencia en mensaje
        const messageMatch = messageMatchMap.get(chat.id);

        uniqueChatsMap.set(chat.id, {
          ...chat,
          contact_name:
            chat.contact?.name ||
            chat.contact_name ||
            chat.name ||
            "Sin nombre",
          contact_phone:
            chat.contact?.phone_number || chat.contact_number || chat.chat_id,
          contact_profile_picture_url:
            chat.contact?.profile_picture_url || null,
          bot_name: chat.bot?.session_name || "Bot desconocido",
          // Agregar información de coincidencia en mensaje
          match_message: messageMatch ? messageMatch.body : null,
          match_timestamp: messageMatch ? messageMatch.timestamp : null,
        });
      }
    });

    const results = Array.from(uniqueChatsMap.values());
    // console.log('✅ Resultados de búsqueda global:', results.length)

    // Ordenar por última actividad
    results.sort((a, b) => {
      const dateA = new Date(
        a.last_message_time || a.updated_at || a.created_at,
      );
      const dateB = new Date(
        b.last_message_time || b.updated_at || b.created_at,
      );
      return dateB - dateA;
    });

    return results;
  } catch (error) {
    console.error("❌ Error en búsqueda global:", error);
    return [];
  }
}

/**
 * Descarga una conversación en formato TXT
 */
export function downloadConversationAsTxt(conversation) {
  const { contact, name, chat_id, messages } = conversation;
  const contactIdentifier = contact?.name || name || chat_id;

  let conversationText = `Conversación con ${contactIdentifier}\n`;
  conversationText += `ID: ${chat_id}\n`;
  conversationText += `Fecha: ${new Date().toLocaleString()}\n`;
  conversationText += `Total de mensajes: ${messages?.length || 0}\n`;
  conversationText += `\n${"=".repeat(60)}\n\n`;

  if (messages && messages.length > 0) {
    messages.forEach((msg) => {
      const sender = msg.from_me ? "Bot" : contactIdentifier;
      const formattedTimestamp = new Date(msg.timestamp).toLocaleString();
      conversationText += `[${formattedTimestamp}] ${sender}:\n${msg.body || ""}\n\n`;
    });
  }

  const blob = new Blob([conversationText], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `conversacion_${contactIdentifier}_${Date.now()}.txt`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Descarga una conversación en formato Markdown
 */
export function downloadConversationAsMarkdown(conversation) {
  const { contact, name, chat_id, messages, bot } = conversation;
  const contactIdentifier = contact?.name || name || chat_id;

  let markdown = `# Conversación con ${contactIdentifier}\n\n`;
  markdown += `**Bot:** ${bot?.session_name || "N/A"}\n`;
  markdown += `**ID de WhatsApp:** \`${chat_id}\`\n`;
  markdown += `**Fecha de descarga:** ${new Date().toLocaleString()}\n`;
  markdown += `**Total de mensajes:** ${messages?.length || 0}\n\n`;
  markdown += `---\n\n`;

  if (messages && messages.length > 0) {
    messages.forEach((msg) => {
      const sender = msg.from_me ? "🤖 **Bot**" : `👤 **${contactIdentifier}**`;
      const formattedTimestamp = new Date(msg.timestamp).toLocaleString();
      markdown += `### ${sender}\n`;
      markdown += `*${formattedTimestamp}*\n\n`;
      markdown += `${msg.body || ""}\n\n`;
      markdown += `---\n\n`;
    });
  }

  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `conversacion_${contactIdentifier}_${Date.now()}.md`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Obtiene el número de ventas concretadas basado en análisis de IA
 * @returns {Promise<number>} Número de ventas concretadas
 */
export async function getCompletedSalesCount() {
  try {
    // console.log('📊 Obteniendo ventas concretadas...')

    // Buscar chats que tengan análisis de IA con venta concretada
    const { data: chatsWithSales, error } = await supabase
      .from("chats")
      .select(
        `
        id,
        contact_name,
        contact_number,
        chat_id,
        bot:bots(session_name),
        last_message_time
      `,
      )
      .not("ai_analysis", "is", null)
      .eq("ai_analysis->sale_completed", true)
      .order("last_message_time", { ascending: false });

    if (error) {
      console.error("❌ Error obteniendo ventas concretadas:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return 0;
    }

    // console.log(`✅ ${chatsWithSales?.length || 0} ventas concretadas encontradas`)
    return chatsWithSales?.length || 0;
  } catch (error) {
    console.error("❌ Exception en getCompletedSalesCount:", error.message || error);
    return 0;
  }
}

/**
 * Obtiene la lista detallada de conversaciones con ventas concretadas
 * @param {number} limit - Límite de resultados (default: 100)
 * @returns {Promise<Array>} Array de conversaciones con ventas concretadas
 */
export async function getCompletedSalesConversations(limit = 100) {
  try {
    // console.log('📊 Obteniendo conversaciones con ventas concretadas...')

    const { data: salesConversations, error } = await supabase
      .from("chats")
      .select(
        `
        id,
        contact_name,
        contact_number,
        chat_id,
        last_message_time,
        ai_analysis,
        bot:bots(id, session_name, phone_number),
        contact:contacts(name, phone_number, profile_picture_url)
      `,
      )
      .not("ai_analysis", "is", null)
      .eq("ai_analysis->sale_completed", true)
      .order("last_message_time", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Error obteniendo conversaciones con ventas:", error);
      return [];
    }

    // Procesar y enriquecer los datos
    const processedConversations = (salesConversations || []).map((conv) => {
      // Determinar nombre del contacto con múltiples fallbacks
      let displayName = "Sin nombre";
      if (conv.contact?.name) {
        displayName = conv.contact.name;
      } else if (conv.contact_name) {
        displayName = conv.contact_name;
      } else if (conv.contact?.phone_number) {
        displayName = conv.contact.phone_number;
      } else if (conv.contact_number) {
        displayName = conv.contact_number;
      } else if (conv.chat_id) {
        displayName = conv.chat_id.split("@")[0];
      }

      // Determinar número de teléfono
      let displayPhone = "Sin número";
      if (conv.contact?.phone_number) {
        displayPhone = conv.contact.phone_number;
      } else if (conv.contact_number) {
        displayPhone = conv.contact_number;
      } else if (conv.chat_id) {
        displayPhone = conv.chat_id.split("@")[0];
      }

      // Determinar asesor (del nombre de sesión del bot)
      let advisorName = "Sin asesor";
      if (conv.bot?.session_name) {
        const sessionParts = conv.bot.session_name.split("_");
        // Buscar nombres comunes en la sesión
        const possibleNames = sessionParts.filter(
          (part) =>
            ![
              "nova",
              "apolo",
              "flash",
              "colombia",
              "venezuela",
              "moises",
              "jesus",
              "endry",
            ].includes(part.toLowerCase()),
        );
        if (possibleNames.length > 0) {
          advisorName =
            possibleNames[0].charAt(0).toUpperCase() +
            possibleNames[0].slice(1).toLowerCase();
        } else {
          advisorName = conv.bot.session_name;
        }
      }

      return {
        ...conv,
        displayName,
        displayPhone,
        advisorName,
        formattedDate: conv.last_message_time
          ? new Date(conv.last_message_time).toLocaleString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Sin fecha",
      };
    });

    // console.log(`✅ ${processedConversations.length} conversaciones con ventas procesadas`)
    return processedConversations;
  } catch (error) {
    console.error("❌ Error en getCompletedSalesConversations:", error);
    return [];
  }
}
