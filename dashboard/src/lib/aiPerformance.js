/**
 * Funciones de IA para análisis de rendimiento y generación de reportes
 * Usa rutas API del servidor para llamar a OpenAI desde el backend
 */

/**
 * Verifica si un chat es con un cliente real o es interno (gerentes/staff)
 * Analiza el contenido de los mensajes para determinar el tipo de conversación
 * 
 * @param {Object} chat - Objeto del chat con información básica
 * @param {Array} messages - Últimos mensajes del chat (10-15 recomendado)
 * @returns {Promise<{isCustomerChat: boolean, confidence: number, reason: string}>}
 */
export async function analyzeIfCustomerChat(chat, messages = []) {
  try {
    // Si ya fue analizado previamente, usar cache
    if (chat.ai_analysis?.is_customer_chat !== undefined) {
      return {
        isCustomerChat: chat.ai_analysis.is_customer_chat,
        confidence: chat.ai_analysis.customer_confidence || 0.9,
        reason: chat.ai_analysis.customer_reason || 'Análisis previo',
        fromCache: true,
      };
    }

    // Si no hay mensajes, no podemos analizar
    if (!messages || messages.length === 0) {
      return {
        isCustomerChat: false,
        confidence: 0.5,
        reason: 'Sin mensajes para analizar',
        fromCache: false,
      };
    }

    // Preparar transcripción de los últimos 15 mensajes
    const recentMessages = messages.slice(-15);
    const transcript = recentMessages
      .map((m) => {
        const sender = m.from_me ? 'Asesor' : 'Cliente';
        const content = m.body || m.content || '[Multimedia]';
        return `${sender}: ${content}`;
      })
      .join('\n');

    // Llamar a ruta API del servidor
    const response = await fetch('/api/analyze-customer-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat: {
          contact_name: chat.contact_name || chat.name,
          contact_number: chat.contact_number,
        },
        messages: recentMessages,
      }),
    });

    if (!response.ok) {
      console.error('Error en llamada a API:', response.statusText);
      return {
        isCustomerChat: true, // Por defecto, asumir que es cliente
        confidence: 0.5,
        reason: 'Error en análisis IA',
        fromCache: false,
      };
    }

    const result = await response.json();

    return {
      isCustomerChat: result.isCustomerChat ?? true,
      confidence: result.confidence ?? 0.7,
      reason: result.reason || 'Análisis IA',
      fromCache: result.fromCache || false,
    };
  } catch (error) {
    console.error('Error en analyzeIfCustomerChat:', error);
    return {
      isCustomerChat: true, // Por defecto, no filtrar
      confidence: 0.5,
      reason: 'Error en análisis',
      fromCache: false,
    };
  }
}

/**
 * Genera un reporte completo de rendimiento usando IA
 * Analiza evaluaciones y genera recomendaciones personalizadas
 * 
 * @param {Array} evaluations - Evaluaciones de conversaciones
 * @param {String} advisorName - Nombre del asesor (opcional)
 * @returns {Promise<Object>} - Reporte generado por IA
 */
export async function generatePerformanceReport(evaluations, advisorName = 'Asesor') {
  try {
    // Permitir reportes vacíos
    if (!evaluations || evaluations.length === 0) {
      console.warn('⚠️ Generando reporte sin evaluaciones (análisis vacío)');
      return {
        success: true,
        report: {
          resumen_ejecutivo: `No se encontraron conversaciones válidas para analizar de ${advisorName}. Esto puede deberse a que los chats no tienen mensajes registrados o fueron excluidos por filtros.`,
          fortalezas: [],
          areas_mejora: ['No hay datos disponibles para evaluar'],
          plan_accion: ['Verificar que el bot tenga conversaciones con mensajes', 'Revisar filtros de análisis'],
          metricas_detalladas: {
            tiempo_contacto: 0,
            tiempo_respuesta: 0,
            tiempo_cotizacion: 0,
            cierre_intencion: 0,
            ofrecio_scalapay: 0,
            mas_dos_opciones: 0,
            seguimiento_intencion: 0,
          },
          total_conversaciones: 0,
        }
      };
    }

    // Llamar a ruta API del servidor
    const response = await fetch('/api/performance-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        evaluations,
        advisorName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al generar reporte');
    }

    const reportData = await response.json();

    return {
      success: true,
      report: reportData,
    };
  } catch (error) {
    console.error('Error en generatePerformanceReport:', error);
    return {
      success: false,
      error: error.message,
      report: null,
    };
  }
}

/**
 * Filtra chats para análisis masivo, excluyendo grupos e internos
 * Usa filtrado estructural + cache + IA solo cuando es necesario
 * 
 * @param {Array} chats - Array de chats a filtrar
 * @param {Function} getMessages - Función para obtener mensajes de un chat
 * @returns {Promise<Array>} - Chats filtrados solo de clientes
 */
export async function filterCustomerChats(chats, getMessages) {
  console.log(`🔍 Filtrando ${chats.length} chats...`);

  const filteredChats = [];
  let excluded = {
    groups: 0,
    internal: 0,
    noMessages: 0,
    cached: 0,
    aiAnalyzed: 0,
    passed: 0,
  };

  for (const chat of chats) {
    // FILTRO 1: Excluir grupos explícitos
    if (chat.is_group === true) {
      excluded.groups++;
      continue;
    }

    // FILTRO 2: Excluir por patrones en nombre (grupos internos)
    const nameToCheck = (chat.contact_name || chat.name || '').toLowerCase();
    const internalPatterns = [
      /^\d+$/,  // Solo números (IDs de grupo)
      /grupo/i,
      /equipo/i,
      /staff/i,
      /gerencia/i,
      /reunion/i,
    ];
    
    if (internalPatterns.some(pattern => pattern.test(nameToCheck))) {
      excluded.internal++;
      continue;
    }

    // FILTRO 3: Usar cache si existe análisis previo
    if (chat.ai_analysis?.is_customer_chat !== undefined) {
      excluded.cached++;
      if (chat.ai_analysis.is_customer_chat === false) {
        excluded.internal++;
        continue;
      }
      // Es cliente según cache
      excluded.passed++;
      filteredChats.push({
        ...chat,
        ai_customer_analysis: {
          isCustomerChat: true,
          confidence: chat.ai_analysis.customer_confidence || 0.9,
          reason: 'Análisis previo',
          fromCache: true,
        },
      });
      continue;
    }

    // FILTRO 4: Verificar mensajes mínimos
    const messages = await getMessages(chat.id);
    if (!messages || messages.length < 5) {
      excluded.noMessages++;
      continue;
    }

    // FILTRO 5: Análisis IA SOLO si no hay cache (optimizado)
    // Por defecto asumir que es cliente para no bloquear análisis
    excluded.aiAnalyzed++;
    const analysis = await analyzeIfCustomerChat(chat, messages);
    
    if (!analysis.isCustomerChat && analysis.confidence > 0.7) {
      excluded.internal++;
      console.log(`   ❌ Chat interno: ${chat.contact_name} - ${analysis.reason}`);
      continue;
    }

    // Chat aprobado
    excluded.passed++;
    filteredChats.push({
      ...chat,
      ai_customer_analysis: analysis,
    });
  }

  console.log(`✅ Filtrado completo:
  - Grupos excluidos: ${excluded.groups}
  - Chats internos excluidos: ${excluded.internal}
  - Sin mensajes suficientes: ${excluded.noMessages}
  - Usados desde cache: ${excluded.cached}
  - Analizados con IA: ${excluded.aiAnalyzed}
  - ✓ Chats de clientes: ${excluded.passed}`);

  return filteredChats;
}
