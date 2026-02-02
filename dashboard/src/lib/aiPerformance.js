/**
 * Funciones de IA para análisis de rendimiento y generación de reportes
 * Usa OpenAI GPT-3.5-turbo para análisis inteligente
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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

    // Prompt para clasificación
    const systemPrompt = `Eres un experto en clasificar conversaciones de WhatsApp.
Tu tarea es determinar si una conversación es con un CLIENTE REAL o es un chat INTERNO (gerentes, staff, grupos de trabajo).

INDICADORES DE CLIENTE REAL:
- Consultas sobre productos, precios, disponibilidad
- Preguntas sobre horarios, ubicaciones, envíos
- Solicitudes de cotizaciones
- Seguimiento de pedidos o compras
- Dudas típicas de consumidores
- Lenguaje informal de cliente

INDICADORES DE CHAT INTERNO:
- Menciones de reuniones, juntas, eventos internos
- Discusión de estrategias, métricas, reportes
- Nombres de otros empleados o gerentes
- Coordinación de tareas administrativas
- Términos corporativos (KPIs, targets, etc.)
- Grupos de trabajo o equipos

Responde ÚNICAMENTE con un JSON válido:
{
  "is_customer_chat": boolean,
  "confidence": number (0.0 a 1.0),
  "reason": "Explicación breve de por qué"
}`;

    const userMessage = `Nombre del contacto: ${chat.contact_name || chat.name || 'Sin nombre'}
Número: ${chat.contact_number || 'N/A'}

Transcripción de los últimos mensajes:
---
${transcript}
---

¿Es este un chat con un cliente real o es interno/administrativo?`;

    // Llamar a OpenAI
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Error en llamada a OpenAI:', response.statusText);
      return {
        isCustomerChat: true, // Por defecto, asumir que es cliente
        confidence: 0.5,
        reason: 'Error en análisis IA',
        fromCache: false,
      };
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      isCustomerChat: result.is_customer_chat ?? true,
      confidence: result.confidence ?? 0.7,
      reason: result.reason || 'Análisis IA',
      fromCache: false,
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
 * @param {Object} analysis - Análisis de rendimiento completo
 * @param {Array} evaluations - Evaluaciones de conversaciones
 * @returns {Promise<Object>} - Reporte generado por IA
 */
export async function generatePerformanceReport(analysis, evaluations = []) {
  try {
    // Calcular estadísticas
    const totalEvaluations = evaluations.length;
    const approvedCount = evaluations.filter((e) => e.score >= 7).length;
    const failedCount = evaluations.filter((e) => e.score < 7).length;
    const avgScore = analysis.average_score || 0;
    const avgPercentage = analysis.average_percentage || 0;

    // Analizar parámetros cumplidos
    const parameters = {
      tiempo_contacto: analysis.tiempo_contacto_count || 0,
      tiempo_respuesta: analysis.tiempo_respuesta_count || 0,
      tiempo_cotizacion: analysis.tiempo_cotizacion_count || 0,
      cierre_intencion: analysis.cierre_intencion_count || 0,
      ofrecio_scalapay: analysis.ofrecio_scalapay_count || 0,
      mas_dos_opciones: analysis.mas_dos_opciones_count || 0,
      seguimiento_intencion: analysis.seguimiento_intencion_count || 0,
    };

    // Identificar fortalezas y debilidades
    const sortedParams = Object.entries(parameters).sort((a, b) => b[1] - a[1]);
    const strengths = sortedParams.slice(0, 3);
    const weaknesses = sortedParams.slice(-3);

    // Prompt para generación de reporte
    const systemPrompt = `Eres un gerente de ventas senior experto en análisis de rendimiento.
Genera un reporte ejecutivo profesional en español basado en las métricas de un asesor de ventas.

El reporte debe incluir:
1. Resumen ejecutivo (2-3 oraciones)
2. Fortalezas principales (3 puntos específicos)
3. Áreas de mejora (3 puntos específicos con recomendaciones)
4. Plan de acción (3-5 pasos concretos)

Usa un tono profesional pero constructivo. Basa tus recomendaciones en las métricas reales.

Responde ÚNICAMENTE con un JSON válido:
{
  "executive_summary": "Resumen ejecutivo del rendimiento",
  "strengths": [
    {"area": "Nombre del área fuerte", "description": "Descripción específica"}
  ],
  "improvements": [
    {"area": "Área a mejorar", "recommendation": "Recomendación específica"}
  ],
  "action_plan": [
    {"step": "Paso 1", "priority": "alta|media|baja", "description": "Qué hacer"}
  ]
}`;

    const userMessage = `Analiza el siguiente rendimiento del asesor:

MÉTRICAS GENERALES:
- Total de conversaciones analizadas: ${totalEvaluations}
- Conversaciones aprobadas (score ≥7): ${approvedCount}
- Conversaciones con problemas (score <7): ${failedCount}
- Score promedio: ${avgScore}/10
- Porcentaje promedio de cumplimiento: ${avgPercentage}%

PARÁMETROS EVALUADOS (de ${totalEvaluations} conversaciones):
- Tiempo de contacto adecuado: ${parameters.tiempo_contacto} cumplimientos
- Tiempo de respuesta rápido: ${parameters.tiempo_respuesta} cumplimientos
- Tiempo de cotización eficiente: ${parameters.tiempo_cotizacion} cumplimientos
- Cierre con intención de compra: ${parameters.cierre_intencion} cumplimientos
- Ofrecimiento de Scalapay: ${parameters.ofrecio_scalapay} cumplimientos
- Más de dos opciones presentadas: ${parameters.mas_dos_opciones} cumplimientos
- Seguimiento de intención: ${parameters.seguimiento_intencion} cumplimientos

TOP 3 FORTALEZAS:
${strengths.map((s, i) => `${i + 1}. ${s[0]}: ${s[1]} cumplimientos`).join('\n')}

TOP 3 DEBILIDADES:
${weaknesses.map((w, i) => `${i + 1}. ${w[0]}: ${w[1]} cumplimientos`).join('\n')}

Genera un reporte profesional y accionable.`;

    // Llamar a OpenAI
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en OpenAI: ${response.statusText}`);
    }

    const data = await response.json();
    const report = JSON.parse(data.choices[0].message.content);

    return {
      success: true,
      report: {
        executive_summary: report.executive_summary || 'Reporte generado exitosamente',
        strengths: report.strengths || [],
        improvements: report.improvements || [],
        action_plan: report.action_plan || [],
        generated_at: new Date().toISOString(),
        metrics: {
          total_evaluations: totalEvaluations,
          approved_count: approvedCount,
          failed_count: failedCount,
          avg_score: avgScore,
          avg_percentage: avgPercentage,
          parameters,
        },
      },
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
 * Usa filtrado estructural + IA inteligente
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
    passed: 0,
  };

  for (const chat of chats) {
    // FILTRO 1: Excluir grupos
    if (chat.is_group === true) {
      excluded.groups++;
      continue;
    }

    // FILTRO 2: Obtener mensajes para análisis IA
    const messages = await getMessages(chat.id);
    if (!messages || messages.length < 5) {
      excluded.noMessages++;
      continue;
    }

    // FILTRO 3: Análisis IA para detectar chats internos
    const analysis = await analyzeIfCustomerChat(chat, messages);
    
    if (!analysis.isCustomerChat && analysis.confidence > 0.7) {
      excluded.internal++;
      console.log(`   ❌ Chat interno detectado: ${chat.contact_name} - ${analysis.reason}`);
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
  - ✓ Chats de clientes: ${excluded.passed}`);

  return filteredChats;
}
