// Mock data de análisis para demostración en página de reportes
export const MOCK_ANALYSES = [
  {
    id: 'mock-analysis-1',
    analysis_name: 'Análisis María González - 28/01/2026',
    analysis_date: '2026-01-28T10:30:00Z',
    bot: {
      id: 'bot-1',
      session_name: 'maria_gonzalez_nova_colombia_endry'
    },
    worker: null,
    total_conversations_analyzed: 15,
    average_score: 6.0,
    average_percentage: 85.7,
    created_at: '2026-01-28T10:30:00Z',
    isMock: true
  },
  {
    id: 'mock-analysis-2',
    analysis_name: 'Análisis Carlos Ramírez - 28/01/2026',
    analysis_date: '2026-01-28T11:00:00Z',
    bot: {
      id: 'bot-2',
      session_name: 'carlos_ramirez_apolo_venezuela_moises'
    },
    worker: null,
    total_conversations_analyzed: 18,
    average_score: 4.8,
    average_percentage: 68.5,
    created_at: '2026-01-28T11:00:00Z',
    isMock: true
  },
  {
    id: 'mock-analysis-3',
    analysis_name: 'Análisis Mariangel Yepes - 28/01/2026',
    analysis_date: '2026-01-28T14:15:00Z',
    bot: {
      id: 'bot-3',
      session_name: 'mariangel_yepes_colombia_endry_2'
    },
    worker: null,
    total_conversations_analyzed: 12,
    average_score: 5.5,
    average_percentage: 78.5,
    created_at: '2026-01-28T14:15:00Z',
    isMock: true
  },
  {
    id: 'mock-analysis-4',
    analysis_name: 'Análisis Andrea Gutiérrez - 28/01/2026',
    analysis_date: '2026-01-28T15:45:00Z',
    bot: {
      id: 'bot-4',
      session_name: 'andrea_gutierrez_colombia_2_endry'
    },
    worker: null,
    total_conversations_analyzed: 10,
    average_score: 4.2,
    average_percentage: 60.0,
    created_at: '2026-01-28T15:45:00Z',
    isMock: true
  }
];

// Mock reportes - los primeros 2 tienen reporte, los otros 2 están pendientes
export const MOCK_REPORT_STATUSES = {
  'mock-analysis-1': {
    hasReport: true,
    report: {
      id: 'mock-report-1',
      performance_analysis_id: 'mock-analysis-1',
      report_data: {
        advisorName: "María González",
        analysisDate: "2026-01-28",
        totalConversations: 15,
        score: 8.5,
        percentage: 85,
        summary: {
          strengths: [
            "Excelente tiempo de respuesta, promedio de 2 minutos",
            "Siempre ofrece Scalapay como opción de pago",
            "Proporciona múltiples alternativas de productos",
            "Buen seguimiento a clientes con intención de compra"
          ],
          weaknesses: [
            "En 3 ocasiones tardó más de 15 minutos en primer contacto",
            "No siempre cierra con intención de compra clara",
            "Falta preguntar dudas específicas del cliente antes de cotizar"
          ]
        },
        recommendations: {
          immediate: [
            "Responder el primer mensaje del cliente en menos de 5 minutos SIEMPRE",
            "Al finalizar cada conversación, preguntar explícitamente: '¿Te gustaría que reserve este producto?'",
            "Antes de cotizar, preguntar: '¿Tienes alguna duda o preferencia específica?'"
          ],
          longTerm: [
            "Crear plantillas de respuesta rápida para consultas frecuentes",
            "Implementar un checklist mental antes de cerrar cada conversación",
            "Practicar técnicas de cierre de venta más directas en role-playing"
          ]
        },
        detailedMetrics: [
          {
            parameter: "Tiempo de Primer Contacto",
            status: "pass",
            details: "12/15 conversaciones respondidas en menos de 5 minutos. Promedio: 3.2 minutos."
          },
          {
            parameter: "Ofreció Scalapay",
            status: "pass",
            details: "15/15 conversaciones mencionaron Scalapay. 100% de cumplimiento."
          },
          {
            parameter: "Tiempo de Respuesta General",
            status: "pass",
            details: "Promedio de respuesta: 2.1 minutos. Excelente desempeño."
          },
          {
            parameter: "Cierre con Intención de Compra",
            status: "fail",
            details: "Solo 9/15 conversaciones terminaron con pregunta explícita de cierre. Mejorar al 100%."
          }
        ],
        conversationExamples: [
          {
            type: "good",
            title: "Excelente Manejo de Scalapay",
            description: "Lead interesado en paquete a Colombia. María ofreció Scalapay proactivamente.",
            leadId: "584142906886",
            excerpt: "Para tu comodidad, puedes pagar con Scalapay en 3 cuotas sin interés. ¿Te gustaría que te reserve el paquete con esta opción de pago?"
          },
          {
            type: "bad",
            title: "Falta de Cierre Claro",
            description: "Conversación terminó sin confirmar intención de compra del cliente.",
            leadId: "584128080380",
            excerpt: "Cliente: 'Ok, déjame pensarlo' - María: 'Perfecto, cualquier duda me avisas' (No preguntó cuándo decidirá o si tiene dudas específicas)"
          },
          {
            type: "good",
            title: "Seguimiento Efectivo",
            description: "Lead que había consultado hace 2 días. María hizo seguimiento proactivo.",
            leadId: "584121812586",
            excerpt: "Hola! Te escribo para saber si ya pudiste revisar las opciones de paquetes que te envié. ¿Tienes alguna duda adicional? Recuerda que puedo reservarlo hoy con Scalapay."
          }
        ]
      }
    }
  },
  'mock-analysis-2': {
    hasReport: true,
    report: {
      id: 'mock-report-2',
      performance_analysis_id: 'mock-analysis-2',
      report_data: {
        advisorName: "Carlos Ramírez",
        analysisDate: "2026-01-28",
        totalConversations: 18,
        score: 6.8,
        percentage: 68,
        summary: {
          strengths: [
            "Buen tiempo de cotización, promedio de 5 minutos",
            "Siempre ofrece múltiples opciones de productos"
          ],
          weaknesses: [
            "Tiempo de primer contacto inconsistente (hasta 30 minutos)",
            "Olvidó mencionar Scalapay en 5 conversaciones",
            "Falta de seguimiento en 4 clientes con intención de compra"
          ]
        },
        recommendations: {
          immediate: [
            "URGENTE: Reducir tiempo de primer contacto a máximo 5 minutos",
            "Incluir Scalapay en TODAS las conversaciones",
            "Antes de despedirte, SIEMPRE preguntar sobre intención de compra"
          ],
          longTerm: [
            "Implementar sistema de recordatorio para seguimiento a clientes",
            "Practicar cierres de venta más directos en role-playing"
          ]
        },
        detailedMetrics: [
          {
            parameter: "Tiempo de Primer Contacto",
            status: "fail",
            details: "Solo 9/18 conversaciones con respuesta en menos de 5 min."
          },
          {
            parameter: "Ofreció Scalapay",
            status: "fail",
            details: "13/18 conversaciones mencionaron Scalapay. Faltó en 5 casos."
          }
        ]
      }
    }
  },
  'mock-analysis-3': {
    hasReport: false,
    report: null
  },
  'mock-analysis-4': {
    hasReport: false,
    report: null
  }
};
