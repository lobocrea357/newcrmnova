/**
 * Sistema de Detección de Ventas con IA Especializada
 * Analiza conversaciones para detectar ventas confirmadas, leads calientes y oportunidades
 */

// ============================================
// NUEVOS PARÁMETROS ENFOCADOS EN VENTAS
// ============================================

export const PARAMETROS_VENTAS = [
  { key: "venta_confirmada", label: "Venta Confirmada", icon: "💰", peso: 10 },
  { key: "lead_caliente", label: "Lead Caliente", icon: "🔥", peso: 8 },
  { key: "cotizacion_enviada", label: "Cotización Enviada", icon: "📊", peso: 6 },
  { key: "metodo_pago_enviado", label: "Método de Pago Enviado", icon: "💳", peso: 7 },
  { key: "objeciones_superadas", label: "Objeciones Superadas", icon: "🛡️", peso: 8 },
  { key: "seguimiento_efectivo", label: "Seguimiento Efectivo", icon: "📞", peso: 6 },
  { key: "urgencia_creada", label: "Urgencia/Escasez Creada", icon: "⏰", peso: 5 },
  { key: "valor_agregado", label: "Valor Agregado Comunicado", icon: "⭐", peso: 7 },
];

// ============================================
// CRITERIOS IA PARA DETECCIÓN DE VENTAS
// ============================================

export const CRITERIOS_VENTAS_IA = {
  venta_confirmada: {
    descripcion: "Cliente confirma explícitamente la compra o reserva",
    keywords_positivos: [
      "confirmo", "reservo", "compro", "acepto", "perfecto", "dale", "procede",
      "háganlo", "sí quiero", "me convence", "está bien", "me gusta", "perfecto",
      "transferencia", "pago", "depósito", "abono", "reserva", "apartado",
      "cuando empezamos", "cuándo viajamos", "hagámoslo", "listo", "ok", "bueno"
    ],
    keywords_negativos: [
      "no puedo", "no me alcanza", "muy caro", "lo pensaré", "después",
      "más tarde", "no gracias", "no me interesa", "cancelar", "no quiero",
      "imposible", "difícil", "complicado"
    ],
    patrones_confirmacion: [
      /\b(sí|si|yes|dale|ok|bueno|listo|perfecto)\b.*\b(quiero|acepto|confirmo|reservo)\b/i,
      /\b(transferencia|pago|depósito)\b.*\b(hago|envío|mando)\b/i,
      /\b(cuando|cuándo)\b.*\b(empezamos|viajamos|salimos)\b/i,
      /\b(apartado|reserva|reservo)\b/i
    ],
    confidence_threshold: 0.8
  },

  lead_caliente: {
    descripcion: "Cliente muestra alto interés pero no confirma aún",
    keywords: [
      "me interesa", "me gusta", "está bueno", "qué buena opción", "interesante",
      "cuándo", "cómo", "dónde", "requisitos", "condiciones", "documentos",
      "presupuesto", "financiación", "opciones", "modalidades", "planes",
      "me llama la atención", "suena bien", "se ve bien", "qué incluye",
      "cuéntame más", "explícame", "detalles", "información"
    ],
    patrones_interes: [
      /\b(me interesa|me gusta|suena bien)\b/i,
      /\b(cuándo|cómo|dónde|qué)\b.*\b(incluye|costo|precio|requisitos)\b/i,
      /\b(más información|más detalles|cuéntame)\b/i
    ],
    confidence_threshold: 0.7
  },

  cotizacion_enviada: {
    descripcion: "Asesor envía cotización o precios específicos",
    keywords: [
      "precio", "costo", "vale", "son", "cotización", "presupuesto",
      "paquete", "opción", "plan", "modalidad", "incluye", "total"
    ],
    patrones_precio: [
      /\$[\d,.]+(?: USD| COP| pesos)?/i,
      /\b\d{1,3}(?:[,.]?\d{3})*\b.*(?:pesos|USD|COP|dólares)/i,
      /\b(?:cuesta|vale|son|precio|costo)\b.*\$?\d+/i,
      /\bcotización\b.*\$?\d+/i
    ],
    debe_incluir_numero: true,
    confidence_threshold: 0.9
  },

  metodo_pago_enviado: {
    descripcion: "Asesor envía información de métodos de pago específicos",
    keywords: [
      "transferencia", "cuenta", "nequi", "daviplata", "pse", "tarjeta",
      "efectivo", "consignación", "banco", "número de cuenta", "datos bancarios",
      "código QR", "link de pago", "enlace", "pasarela"
    ],
    patrones_pago: [
      /\b(?:cuenta|número)\b.*\b(?:bancaria|banco)\b/i,
      /\b(?:nequi|daviplata|pse)\b/i,
      /\b(?:transferencia|consignación)\b/i,
      /\b(?:código QR|link|enlace)\b.*\b(?:pago|transferencia)\b/i
    ],
    confidence_threshold: 0.8
  },

  objeciones_superadas: {
    descripcion: "Asesor maneja bien las objeciones del cliente",
    keywords_objeciones: [
      "muy caro", "costoso", "no puedo", "no tengo", "pensarlo", "dudas",
      "no sé", "difícil", "complicado", "tiempo", "experiencia"
    ],
    keywords_manejo: [
      "entiendo", "comprendo", "normal", "te explico", "mira", "considera",
      "piensa", "opciones", "alternativas", "financiación", "cuotas",
      "facilidades", "descuento", "promoción", "oferta"
    ],
    confidence_threshold: 0.7
  },

  seguimiento_efectivo: {
    descripcion: "Asesor hace seguimiento proactivo y efectivo",
    keywords: [
      "alguna duda", "qué te parece", "te interesa", "qué opinas",
      "tienes preguntas", "cuéntame", "qué necesitas", "puedo ayudarte",
      "seguimiento", "recordatorio", "retomar", "continuar", "avanzar",
      "decidiste", "qué tal", "como vas", "news", "novedades"
    ],
    patrones_seguimiento: [
      /\b(?:alguna|tienes)\b.*\bduda\b/i,
      /\b(?:qué te parece|qué opinas|te interesa)\b/i,
      /\b(?:seguimiento|recordatorio|retomar)\b/i,
      /\b(?:decidiste|como vas|qué tal)\b/i
    ],
    confidence_threshold: 0.6
  },

  urgencia_creada: {
    descripcion: "Asesor crea sensación de urgencia o escasez",
    keywords: [
      "últimas", "pocas", "quedan", "pronto", "rápido", "limitado",
      "oferta", "promoción", "descuento", "temporal", "hasta", "solo",
      "aprovecha", "oportunidad", "ahora", "hoy", "esta semana"
    ],
    patrones_urgencia: [
      /\b(?:últimas|pocas|solo)\b.*\b(?:plazas|cupos|espacios)\b/i,
      /\b(?:oferta|promoción)\b.*\b(?:hasta|temporal|limitada)\b/i,
      /\b(?:aprovecha|oportunidad)\b.*\b(?:ahora|hoy|pronto)\b/i
    ],
    confidence_threshold: 0.6
  },

  valor_agregado: {
    descripcion: "Asesor comunica valor agregado y beneficios únicos",
    keywords: [
      "incluye", "adicional", "gratis", "sin costo", "beneficio", "ventaja",
      "exclusivo", "especial", "único", "experiencia", "calidad", "servicio",
      "garantía", "seguro", "respaldo", "confianza", "años", "experiencia"
    ],
    patrones_valor: [
      /\b(?:incluye|gratis|sin costo)\b/i,
      /\b(?:años|experiencia)\b.*\b(?:mercado|sector)\b/i,
      /\b(?:garantía|seguro|respaldo)\b/i,
      /\b(?:exclusivo|especial|único)\b/i
    ],
    confidence_threshold: 0.6
  }
};

// ============================================
// FUNCIONES DE ANÁLISIS DE VENTAS
// ============================================

/**
 * Analiza si una conversación contiene una venta confirmada
 * @param {Array} messages - Mensajes de la conversación
 * @returns {Object} - Resultado del análisis
 */
export function analyzeVentaConfirmada(messages) {
  const clientMessages = messages.filter(m => !m.from_me);
  const criterio = CRITERIOS_VENTAS_IA.venta_confirmada;

  let positiveSignals = 0;
  let negativeSignals = 0;
  let confirmationPatterns = 0;
  let confirmedText = '';

  clientMessages.forEach(msg => {
    const text = (msg.body || msg.content || '').toLowerCase();

    // Buscar keywords positivos
    criterio.keywords_positivos.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        positiveSignals++;
        if (!confirmedText) confirmedText = msg.body || msg.content;
      }
    });

    // Buscar keywords negativos
    criterio.keywords_negativos.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        negativeSignals++;
      }
    });

    // Buscar patrones de confirmación
    criterio.patrones_confirmacion.forEach(pattern => {
      if (pattern.test(text)) {
        confirmationPatterns++;
        if (!confirmedText) confirmedText = msg.body || msg.content;
      }
    });
  });

  const confidence = Math.min(
    (positiveSignals * 0.3 + confirmationPatterns * 0.7) / Math.max(1, negativeSignals * 0.5),
    1
  );

  return {
    cumple: confidence >= criterio.confidence_threshold,
    confidence: confidence,
    evidencia: confirmedText,
    detalles: {
      positive_signals: positiveSignals,
      negative_signals: negativeSignals,
      confirmation_patterns: confirmationPatterns
    }
  };
}

/**
 * Extrae el valor monetario de una conversación
 * @param {Array} messages - Mensajes de la conversación
 * @returns {Object} - Valor encontrado y confianza
 */
export function extractVentaValue(messages) {
  const advisorMessages = messages.filter(m => m.from_me);
  const criterio = CRITERIOS_VENTAS_IA.cotizacion_enviada;

  let maxValue = 0;
  let valueText = '';
  let confidence = 0;

  advisorMessages.forEach(msg => {
    const text = msg.body || msg.content || '';

    // Buscar patrones de precio
    criterio.patrones_precio.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        // Extraer números del match
        const numberMatch = matches[0].match(/\d[\d,.]*/);
        if (numberMatch) {
          const value = parseFloat(numberMatch[0].replace(/,/g, ''));
          if (value > maxValue) {
            maxValue = value;
            valueText = matches[0];
            confidence = 0.8;
          }
        }
      }
    });
  });

  return {
    valor: maxValue > 0 ? maxValue : null,
    texto_evidencia: valueText,
    confidence: confidence
  };
}

/**
 * Analiza el nivel de interés del cliente
 * @param {Array} messages - Mensajes de la conversación
 * @returns {String} - 'alto', 'medio', 'bajo'
 */
export function analyzeInterestLevel(messages) {
  const clientMessages = messages.filter(m => !m.from_me);
  const criterio = CRITERIOS_VENTAS_IA.lead_caliente;

  let interestSignals = 0;
  let questionCount = 0;

  clientMessages.forEach(msg => {
    const text = (msg.body || msg.content || '').toLowerCase();

    // Contar señales de interés
    criterio.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        interestSignals++;
      }
    });

    // Contar preguntas (signo de interés)
    if (text.includes('?') || text.includes('cuándo') || text.includes('cómo') || text.includes('dónde')) {
      questionCount++;
    }
  });

  const totalSignals = interestSignals + (questionCount * 0.5);

  if (totalSignals >= 4) return 'alto';
  if (totalSignals >= 2) return 'medio';
  return 'bajo';
}

/**
 * Evalúa todos los parámetros de ventas en una conversación
 * @param {Array} messages - Mensajes de la conversación
 * @returns {Object} - Evaluación completa
 */
export function evaluateAllSalesParameters(messages) {
  const evaluation = {};
  let totalScore = 0;
  const maxScore = PARAMETROS_VENTAS.reduce((sum, param) => sum + param.peso, 0);

  // Evaluar cada parámetro
  PARAMETROS_VENTAS.forEach(param => {
    let result = { cumple: false, confidence: 0, evidencia: '' };

    switch(param.key) {
      case 'venta_confirmada':
        result = analyzeVentaConfirmada(messages);
        break;
      case 'lead_caliente':
        const interestLevel = analyzeInterestLevel(messages);
        result = {
          cumple: interestLevel === 'alto' || interestLevel === 'medio',
          confidence: interestLevel === 'alto' ? 0.9 : interestLevel === 'medio' ? 0.6 : 0.2,
          evidencia: `Nivel de interés: ${interestLevel}`
        };
        break;
      case 'cotizacion_enviada':
        const valueData = extractVentaValue(messages);
        result = {
          cumple: valueData.valor !== null,
          confidence: valueData.confidence,
          evidencia: valueData.texto_evidencia
        };
        break;
      default:
        // Para otros parámetros, usar análisis general por keywords
        result = analyzeParameterByKeywords(messages, param.key);
    }

    evaluation[param.key] = result.cumple;
    if (result.cumple) {
      totalScore += param.peso;
    }

    // Guardar detalles adicionales
    evaluation[`${param.key}_confidence`] = result.confidence;
    evaluation[`${param.key}_evidencia`] = result.evidencia;
  });

  // Agregar información del valor de venta
  const ventaValue = extractVentaValue(messages);
  evaluation.valor_venta = ventaValue.valor;
  evaluation.interest_level = analyzeInterestLevel(messages);

  return {
    ...evaluation,
    score_ventas: totalScore,
    max_score_ventas: maxScore,
    percentage_ventas: ((totalScore / maxScore) * 100).toFixed(1),
    es_venta: evaluation.venta_confirmada === true,
    es_lead_caliente: evaluation.lead_caliente === true,
    valor_estimado: ventaValue.valor
  };
}

/**
 * Analiza parámetro por keywords (para parámetros no especializados)
 * @param {Array} messages - Mensajes de la conversación
 * @param {String} parameterKey - Clave del parámetro a analizar
 * @returns {Object} - Resultado del análisis
 */
function analyzeParameterByKeywords(messages, parameterKey) {
  const criterio = CRITERIOS_VENTAS_IA[parameterKey];
  if (!criterio) {
    return { cumple: false, confidence: 0, evidencia: '' };
  }

  const allText = messages.map(m => m.body || m.content || '').join(' ').toLowerCase();
  let keywordMatches = 0;
  let patternMatches = 0;
  let evidenceText = '';

  // Buscar keywords
  if (criterio.keywords) {
    criterio.keywords.forEach(keyword => {
      if (allText.includes(keyword.toLowerCase())) {
        keywordMatches++;
        if (!evidenceText) {
          // Encontrar el mensaje específico
          const msg = messages.find(m =>
            (m.body || m.content || '').toLowerCase().includes(keyword.toLowerCase())
          );
          if (msg) evidenceText = msg.body || msg.content || '';
        }
      }
    });
  }

  // Buscar patrones si existen
  if (criterio.patrones_seguimiento || criterio.patrones_pago || criterio.patrones_urgencia || criterio.patrones_valor) {
    const patterns = criterio.patrones_seguimiento || criterio.patrones_pago || criterio.patrones_urgencia || criterio.patrones_valor || [];
    patterns.forEach(pattern => {
      if (pattern.test(allText)) {
        patternMatches++;
        if (!evidenceText) {
          const matches = allText.match(pattern);
          if (matches) evidenceText = matches[0];
        }
      }
    });
  }

  const confidence = Math.min((keywordMatches * 0.4 + patternMatches * 0.6) / 3, 1);

  return {
    cumple: confidence >= (criterio.confidence_threshold || 0.5),
    confidence: confidence,
    evidencia: evidenceText
  };
}

/**
 * Genera recomendaciones basadas en el análisis
 * @param {Object} evaluation - Evaluación de parámetros
 * @param {Array} messages - Mensajes originales
 * @returns {Object} - Éxitos, errores y recomendaciones
 */
export function generateSalesRecommendations(evaluation, messages) {
  const exitos = [];
  const errores = [];
  const recomendaciones = [];

  // Analizar éxitos
  PARAMETROS_VENTAS.forEach(param => {
    if (evaluation[param.key]) {
      exitos.push(`✅ ${param.label}: ${evaluation[`${param.key}_evidencia`] || 'Cumplido correctamente'}`);
    }
  });

  // Analizar errores y generar recomendaciones
  if (!evaluation.venta_confirmada) {
    if (evaluation.lead_caliente) {
      errores.push("⚠️ Lead caliente sin cerrar: El cliente mostró interés pero no se concretó la venta");
      recomendaciones.push("📞 Realizar seguimiento inmediato con propuesta específica");
    } else {
      errores.push("❌ No se generó interés suficiente en el cliente");
      recomendaciones.push("💡 Mejorar presentación de valor y beneficios únicos");
    }
  }

  if (!evaluation.cotizacion_enviada) {
    errores.push("❌ No se envió cotización específica");
    recomendaciones.push("📊 Siempre proporcionar precios claros y específicos");
  }

  if (!evaluation.metodo_pago_enviado) {
    errores.push("❌ No se facilitaron métodos de pago");
    recomendaciones.push("💳 Enviar opciones de pago para facilitar la compra");
  }

  if (!evaluation.seguimiento_efectivo) {
    errores.push("❌ Falta seguimiento proactivo");
    recomendaciones.push("📞 Implementar seguimiento estructurado post-cotización");
  }

  return {
    exitos,
    errores,
    recomendaciones,
    siguiente_accion: evaluation.venta_confirmada
      ? "🎉 Procesar venta y hacer onboarding del cliente"
      : evaluation.lead_caliente
      ? "📞 Seguimiento inmediato en 24 horas"
      : "💡 Reevaluar estrategia de acercamiento"
  };
}

// ============================================
// FUNCIONES DE REPORTE
// ============================================

/**
 * Genera estadísticas agregadas de un conjunto de evaluaciones
 * @param {Array} evaluations - Array de evaluaciones
 * @returns {Object} - Estadísticas agregadas
 */
export function generateSalesStats(evaluations) {
  const total = evaluations.length;
  if (total === 0) return null;

  const stats = {
    total_conversaciones: total,
    ventas_confirmadas: 0,
    leads_calientes: 0,
    cotizaciones_enviadas: 0,
    valor_total: 0,
    tasa_conversion: 0,
    valor_promedio: 0
  };

  evaluations.forEach(evaluation => {
    if (evaluation.venta_confirmada) stats.ventas_confirmadas++;
    if (evaluation.lead_caliente) stats.leads_calientes++;
    if (evaluation.cotizacion_enviada) stats.cotizaciones_enviadas++;
    if (evaluation.valor_estimado) stats.valor_total += evaluation.valor_estimado;
  });

  stats.tasa_conversion = ((stats.ventas_confirmadas / total) * 100).toFixed(1);
  stats.valor_promedio = stats.ventas_confirmadas > 0
    ? (stats.valor_total / stats.ventas_confirmadas).toFixed(0)
    : 0;

  return stats;
}
