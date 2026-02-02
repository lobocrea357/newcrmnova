// Mock data de reportes generados por IA para pruebas
export const MOCK_REPORTS = {
  "analysis-1": {
    advisorName: "María González",
    analysisDate: "2026-01-29",
    totalConversations: 15,
    score: 8.5,
    percentage: 85,
    
    summary: {
      strengths: [
        "Excelente tiempo de respuesta, promedio de 2 minutos",
        "Siempre ofrece Scalapay como opción de pago",
        "Proporciona múltiples alternativas de productos",
        "Seguimiento efectivo con clientes interesados"
      ],
      weaknesses: [
        "En 3 ocasiones tardó más de 15 minutos en primer contacto",
        "No siempre cierra con intención de compra clara",
        "Falta mejorar tiempo de cotización en productos personalizados"
      ]
    },
    
    recommendations: {
      immediate: [
        "Responder el primer mensaje del cliente en menos de 5 minutos, incluso si es solo para saludar y decir que revisará su consulta.",
        "Al finalizar cada conversación, preguntar explícitamente: '¿Te gustaría que reserve este producto?' o '¿Procedo con tu pedido?'",
        "Para cotizaciones personalizadas, establecer un tiempo máximo de 10 minutos. Si necesita más tiempo, informar al cliente."
      ],
      longTerm: [
        "Crear plantillas de respuesta rápida para consultas frecuentes sobre Scalapay y métodos de pago",
        "Implementar un checklist mental antes de cerrar cada conversación: ¿Ofrecí Scalapay? ¿Di opciones? ¿Hice seguimiento?",
        "Solicitar capacitación adicional en productos personalizados para agilizar cotizaciones"
      ]
    },
    
    detailedMetrics: [
      {
        parameter: "Tiempo de Primer Contacto",
        status: "pass",
        details: "12/15 conversaciones respondidas en menos de 5 minutos. Casos de demora: 8min, 15min, 18min."
      },
      {
        parameter: "Tiempo de Respuesta",
        status: "pass",
        details: "Promedio: 2.3 minutos. Excelente consistencia en mantener conversación activa."
      },
      {
        parameter: "Tiempo de Cotización",
        status: "fail",
        details: "4/15 cotizaciones tardaron más de 10 minutos. Máximo registrado: 22 minutos en producto personalizado."
      },
      {
        parameter: "Cierre con Intención",
        status: "pass",
        details: "11/15 conversaciones cerraron con pregunta clara de cierre. Mejorar en 4 casos donde quedó ambiguo."
      },
      {
        parameter: "Ofreció Scalapay",
        status: "pass",
        details: "15/15 conversaciones mencionaron Scalapay. 100% de cumplimiento. ¡Excelente!"
      },
      {
        parameter: "Más de 2 Opciones",
        status: "pass",
        details: "13/15 conversaciones ofrecieron al menos 2 alternativas. Solo 2 casos con opción única."
      },
      {
        parameter: "Seguimiento a Intención",
        status: "pass",
        details: "9/10 casos con intención de compra recibieron seguimiento. 1 caso sin seguimiento después de 24h."
      }
    ],
    
    conversationExamples: [
      {
        type: "success",
        title: "Ejemplo de conversación excelente",
        summary: "Cliente pregunta por laptop. Respuesta en 1 min, ofreció 3 opciones, mencionó Scalapay, cerró con '¿Procedo con tu pedido?'. Cliente confirmó compra."
      },
      {
        type: "improvement",
        title: "Oportunidad de mejora",
        summary: "Cliente pregunta por mochila personalizada. Primera respuesta en 15 min, cotización tardó 22 min. No cerró con pregunta directa. Cliente dijo 'lo pensaré'."
      }
    ]
  },
  
  "analysis-2": {
    advisorName: "Carlos Ramírez",
    analysisDate: "2026-01-29",
    totalConversations: 18,
    score: 6.8,
    percentage: 68,
    
    summary: {
      strengths: [
        "Buen tiempo de cotización, promedio de 5 minutos",
        "Siempre ofrece múltiples opciones de productos",
        "Lenguaje amigable y profesional"
      ],
      weaknesses: [
        "Tiempo de primer contacto inconsistente (hasta 30 minutos en algunos casos)",
        "Olvidó mencionar Scalapay en 5 conversaciones",
        "Falta de seguimiento en 4 clientes con intención de compra",
        "Solo 8/18 conversaciones cerraron con pregunta de intención"
      ]
    },
    
    recommendations: {
      immediate: [
        "URGENTE: Reducir tiempo de primer contacto a máximo 5 minutos. Configurar alertas de notificación de WhatsApp.",
        "Incluir Scalapay en TODAS las conversaciones, idealmente al momento de dar el precio. Crear atajo de teclado con el texto.",
        "Antes de despedirte, SIEMPRE preguntar: '¿Quieres que aparte este producto?' o '¿Procedo con tu pedido?'"
      ],
      longTerm: [
        "Implementar un sistema de recordatorio para seguimiento a clientes interesados (después de 24-48 horas)",
        "Practicar cierres de venta más directos en role-playing con el equipo",
        "Solicitar feedback del supervisor sobre técnicas de cierre efectivas"
      ]
    },
    
    detailedMetrics: [
      {
        parameter: "Tiempo de Primer Contacto",
        status: "fail",
        details: "Solo 9/18 conversaciones con respuesta en menos de 5 min. Casos críticos: 18min, 25min, 30min."
      },
      {
        parameter: "Tiempo de Respuesta",
        status: "pass",
        details: "Promedio: 3.5 minutos. Aceptable pero puede mejorar para llegar a menos de 3 min."
      },
      {
        parameter: "Tiempo de Cotización",
        status: "pass",
        details: "Promedio: 5.2 minutos. Excelente. 16/18 cotizaciones en menos de 10 minutos."
      },
      {
        parameter: "Cierre con Intención",
        status: "fail",
        details: "Solo 8/18 conversaciones cerraron con pregunta clara. 10 casos sin cierre directo."
      },
      {
        parameter: "Ofreció Scalapay",
        status: "fail",
        details: "13/18 conversaciones mencionaron Scalapay. Faltó en 5 casos. Necesita mejorar consistencia."
      },
      {
        parameter: "Más de 2 Opciones",
        status: "pass",
        details: "17/18 conversaciones ofrecieron múltiples opciones. Solo 1 caso con opción única. ¡Muy bien!"
      },
      {
        parameter: "Seguimiento a Intención",
        status: "fail",
        details: "Solo 4/8 casos con intención recibieron seguimiento. 4 casos abandonados sin seguimiento."
      }
    ],
    
    conversationExamples: [
      {
        type: "success",
        title: "Conversación bien manejada",
        summary: "Cliente pregunta por audífonos. Respuesta en 3 min, ofreció 4 opciones con diferentes precios, mencionó Scalapay. Cotización en 4 min."
      },
      {
        type: "improvement",
        title: "Caso crítico que necesita atención",
        summary: "Cliente pregunta por tablet. Primera respuesta después de 30 minutos. No mencionó Scalapay. No cerró con intención. Cliente no volvió a responder."
      }
    ]
  }
};

export function getMockReportByAnalysisId(analysisId) {
  return MOCK_REPORTS[analysisId] || null;
}
