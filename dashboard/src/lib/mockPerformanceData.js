export const MOCK_PERFORMANCE_DATA = {
  date: "2024-05-20",
  teams: {
    Endry: [
      {
        id: "adv_1",
        name: "Ana García",
        avatar: "/avatars/ana.png",
        dailyScore: 8.5,
        trend: "up",
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: true,
          tiempo_cotizacion: true,
          cierre_intencion: true,
          ofrecio_scalapay: false,
          mas_dos_opciones: true,
          seguimiento_intencion: true,
        },
        aiFeedback: {
          strengths: ["Excelente tiempo de respuesta", "Cierre agresivo"],
          improvements: ["Recordar ofrecer Scalapay siempre"],
        },
        history: [
          { date: "2024-05-14", score: 7.5, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: false, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-15", score: 8.0, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-16", score: 8.2, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: true, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-17", score: 8.5, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-18", score: 8.5, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-19", score: 7.8, metrics: { tiempo_contacto: true, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-20", score: 8.5, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: true } },
        ],
      },
      {
        id: "adv_2",
        name: "Carlos Méndez",
        avatar: "/avatars/carlos.png",
        dailyScore: 9.2,
        trend: "up",
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: true,
          tiempo_cotizacion: true,
          cierre_intencion: true,
          ofrecio_scalapay: true,
          mas_dos_opciones: true,
          seguimiento_intencion: true,
        },
        aiFeedback: {
          strengths: [
            "Cumple todos los parámetros consistentemente",
            "Excelente seguimiento",
          ],
          improvements: ["Mantener este nivel de desempeño"],
        },
        history: [
          { date: "2024-05-14", score: 8.8, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: true, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-15", score: 8.9, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: true, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-16", score: 9.0, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: true, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-17", score: 9.1, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: true, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-18", score: 9.0, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-19", score: 9.2, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: true, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-20", score: 9.2, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: true, mas_dos_opciones: true, seguimiento_intencion: true } },
        ],
      },
      {
        id: "adv_3",
        name: "María López",
        avatar: "/avatars/maria.png",
        dailyScore: 6.8,
        trend: "down",
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: false,
          tiempo_cotizacion: true,
          cierre_intencion: true,
          ofrecio_scalapay: false,
          mas_dos_opciones: true,
          seguimiento_intencion: false,
        },
        aiFeedback: {
          strengths: ["Buen primer contacto", "Cotiza rápidamente"],
          improvements: [
            "Mejorar tiempo de respuesta",
            "Implementar seguimiento sistemático",
            "Ofrecer Scalapay en cada conversación",
          ],
        },
        history: [
          { date: "2024-05-14", score: 7.2, metrics: { tiempo_contacto: true, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-15", score: 7.5, metrics: { tiempo_contacto: true, tiempo_respuesta: true, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: false, seguimiento_intencion: true } },
          { date: "2024-05-16", score: 7.0, metrics: { tiempo_contacto: true, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-17", score: 6.9, metrics: { tiempo_contacto: true, tiempo_respuesta: false, tiempo_cotizacion: false, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: true } },
          { date: "2024-05-18", score: 6.8, metrics: { tiempo_contacto: true, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-19", score: 6.5, metrics: { tiempo_contacto: false, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-20", score: 6.8, metrics: { tiempo_contacto: true, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
        ],
      },
      {
        id: "adv_4",
        name: "Roberto Silva",
        avatar: "/avatars/roberto.png",
        dailyScore: 4.2,
        trend: "down",
        metrics: {
          tiempo_contacto: false,
          tiempo_respuesta: false,
          tiempo_cotizacion: true,
          cierre_intencion: false,
          ofrecio_scalapay: false,
          mas_dos_opciones: true,
          seguimiento_intencion: false,
        },
        aiFeedback: {
          strengths: ["Presenta varias opciones de productos"],
          improvements: [
            "URGENTE: Reducir tiempo de contacto inicial",
            "Mejorar velocidad de respuesta",
            "Implementar técnicas de cierre",
            "Ofrecer Scalapay",
            "Seguimiento agresivo necesario",
          ],
        },
        history: [
          { date: "2024-05-14", score: 5.5, metrics: { tiempo_contacto: false, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-15", score: 5.2, metrics: { tiempo_contacto: false, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: false, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-16", score: 4.8, metrics: { tiempo_contacto: false, tiempo_respuesta: false, tiempo_cotizacion: false, cierre_intencion: true, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-17", score: 4.5, metrics: { tiempo_contacto: false, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: false, ofrecio_scalapay: false, mas_dos_opciones: false, seguimiento_intencion: false } },
          { date: "2024-05-18", score: 4.3, metrics: { tiempo_contacto: false, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: false, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-19", score: 4.0, metrics: { tiempo_contacto: false, tiempo_respuesta: false, tiempo_cotizacion: false, cierre_intencion: false, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
          { date: "2024-05-20", score: 4.2, metrics: { tiempo_contacto: false, tiempo_respuesta: false, tiempo_cotizacion: true, cierre_intencion: false, ofrecio_scalapay: false, mas_dos_opciones: true, seguimiento_intencion: false } },
        ],
      },
    ],
    Moises: [
      {
        id: "adv_5",
        name: "Laura Fernández",
        avatar: "/avatars/laura.png",
        dailyScore: 7.8,
        trend: "stable",
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: true,
          tiempo_cotizacion: true,
          cierre_intencion: true,
          ofrecio_scalapay: true,
          mas_dos_opciones: false,
          seguimiento_intencion: true,
        },
        aiFeedback: {
          strengths: [
            "Muy buen cierre de ventas",
            "Ofrece financiamiento consistentemente",
          ],
          improvements: ["Ampliar el catálogo presentado al cliente"],
        },
        history: [7.8, 7.9, 7.8, 7.7, 7.8, 7.8, 7.8],
      },
      {
        id: "adv_6",
        name: "Diego Vargas",
        avatar: "/avatars/diego.png",
        dailyScore: 8.9,
        trend: "up",
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: true,
          tiempo_cotizacion: true,
          cierre_intencion: true,
          ofrecio_scalapay: true,
          mas_dos_opciones: true,
          seguimiento_intencion: false,
        },
        aiFeedback: {
          strengths: [
            "Excelente en todas las etapas de venta",
            "Rápido y efectivo",
          ],
          improvements: ["Implementar seguimiento post-cotización"],
        },
        history: [8.2, 8.4, 8.6, 8.7, 8.8, 8.9, 8.9],
      },
      {
        id: "adv_7",
        name: "Patricia Ruiz",
        avatar: "/avatars/patricia.png",
        dailyScore: 5.5,
        trend: "stable",
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: true,
          tiempo_cotizacion: false,
          cierre_intencion: true,
          ofrecio_scalapay: false,
          mas_dos_opciones: false,
          seguimiento_intencion: true,
        },
        aiFeedback: {
          strengths: ["Buen contacto inicial", "Intenta cerrar ventas"],
          improvements: [
            "Acelerar proceso de cotización",
            "Ofrecer Scalapay",
            "Presentar más opciones",
          ],
        },
        history: [5.6, 5.5, 5.4, 5.5, 5.5, 5.6, 5.5],
      },
    ],
    Jesus: [
      {
        id: "adv_8",
        name: "Jorge Ramírez",
        avatar: "/avatars/jorge.png",
        dailyScore: 9.5,
        trend: "up",
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: true,
          tiempo_cotizacion: true,
          cierre_intencion: true,
          ofrecio_scalapay: true,
          mas_dos_opciones: true,
          seguimiento_intencion: true,
        },
        aiFeedback: {
          strengths: [
            "TOP PERFORMER: Cumple todos los parámetros",
            "Benchmark del equipo",
            "Consistencia excepcional",
          ],
          improvements: ["Compartir mejores prácticas con el equipo"],
        },
        history: [9.0, 9.1, 9.2, 9.3, 9.4, 9.5, 9.5],
      },
      {
        id: "adv_9",
        name: "Sandra Torres",
        avatar: "/avatars/sandra.png",
        dailyScore: 7.2,
        trend: "up",
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: true,
          tiempo_cotizacion: true,
          cierre_intencion: false,
          ofrecio_scalapay: true,
          mas_dos_opciones: true,
          seguimiento_intencion: true,
        },
        aiFeedback: {
          strengths: [
            "Buena presentación de productos",
            "Ofrece financiamiento",
          ],
          improvements: ["Trabajar técnicas de cierre de venta"],
        },
        history: [6.5, 6.7, 6.8, 7.0, 7.1, 7.2, 7.2],
      },
      {
        id: "adv_10",
        name: "Miguel Castillo",
        avatar: "/avatars/miguel.png",
        dailyScore: 4.8,
        trend: "down",
        metrics: {
          tiempo_contacto: false,
          tiempo_respuesta: false,
          tiempo_cotizacion: false,
          cierre_intencion: true,
          ofrecio_scalapay: false,
          mas_dos_opciones: true,
          seguimiento_intencion: false,
        },
        aiFeedback: {
          strengths: ["Intenta cerrar las ventas"],
          improvements: [
            "CRÍTICO: Mejorar tiempos de contacto y respuesta",
            "Acelerar cotizaciones",
            "Ofrecer Scalapay",
            "Implementar seguimiento",
          ],
        },
        history: [5.8, 5.5, 5.2, 5.0, 4.9, 4.7, 4.8],
      },
      {
        id: "adv_11",
        name: "Lucía Morales",
        avatar: "/avatars/lucia.png",
        dailyScore: 8.1,
        trend: "stable",
        metrics: {
          tiempo_contacto: true,
          tiempo_respuesta: true,
          tiempo_cotizacion: true,
          cierre_intencion: true,
          ofrecio_scalapay: true,
          mas_dos_opciones: true,
          seguimiento_intencion: false,
        },
        aiFeedback: {
          strengths: ["Muy buena en todas las etapas", "Consistente"],
          improvements: ["Implementar seguimiento para cerrar más ventas"],
        },
        history: [8.0, 8.1, 8.0, 8.1, 8.2, 8.1, 8.1],
      },
    ],
  },
};

export const METRIC_LABELS = {
  tiempo_contacto: "Tiempo de contacto adecuado",
  tiempo_respuesta: "Tiempo de respuesta rápido",
  tiempo_cotizacion: "Tiempo de cotización eficiente",
  cierre_intencion: "Cierre con intención de compra",
  ofrecio_scalapay: "Ofrecimiento de Scalapay",
  mas_dos_opciones: "Más de dos opciones presentadas",
  seguimiento_intencion: "Seguimiento de intención",
};

export const TEAMS = ["Endry", "Moises", "Jesus"];

// -------------------------
// Mock: conversaciones por asesor para la vista de detalle
// -------------------------

const MOCK_CONVERSATIONS_BY_ADVISOR = {
  adv_1: [
    {
      id: "conv_ana_1",
      contactName: "Luis Pérez",
      contactNumber: "+58 412 000 0001",
      lastMessagePreview: "Perfecto, ¿me puedes pasar las opciones?",
      updatedAt: "2024-05-20T15:40:00Z",
      involvedInAnalysis: true,
      evaluation: {
        tiempo_contacto: true,
        tiempo_respuesta: true,
        tiempo_cotizacion: true,
        cierre_intencion: true,
        ofrecio_scalapay: false,
        mas_dos_opciones: true,
        seguimiento_intencion: true,
        notes: "Buena velocidad, faltó ofrecer Scalapay.",
      },
      messages: [
        {
          id: "m1",
          from: "client",
          text: "Hola, estoy interesado en un iPhone 13.",
          ts: "2024-05-20T14:10:00Z",
        },
        {
          id: "m2",
          from: "advisor",
          text: "Hola Luis, claro. ¿Qué capacidad prefieres: 128 o 256GB?",
          ts: "2024-05-20T14:11:00Z",
        },
        {
          id: "m3",
          from: "client",
          text: "256GB. ¿Qué precio tiene?",
          ts: "2024-05-20T14:12:00Z",
        },
        {
          id: "m4",
          from: "advisor",
          text: "Tenemos 256GB en $XXX. También puedo mostrarte 14 con diferencia pequeña.",
          ts: "2024-05-20T14:13:00Z",
        },
        {
          id: "m5",
          from: "client",
          text: "Perfecto, ¿me puedes pasar las opciones?",
          ts: "2024-05-20T14:15:00Z",
        },
      ],
    },
    {
      id: "conv_ana_2",
      contactName: "Mariana Soto",
      contactNumber: "+58 414 000 0002",
      lastMessagePreview: "Dale, lo reviso y te confirmo.",
      updatedAt: "2024-05-20T18:05:00Z",
      involvedInAnalysis: true,
      evaluation: {
        tiempo_contacto: true,
        tiempo_respuesta: true,
        tiempo_cotizacion: true,
        cierre_intencion: false,
        ofrecio_scalapay: false,
        mas_dos_opciones: true,
        seguimiento_intencion: false,
        notes: "Faltó cierre y seguimiento explícito.",
      },
      messages: [
        {
          id: "m1",
          from: "client",
          text: "Buenas, ¿tienes disponibilidad de Samsung A54?",
          ts: "2024-05-20T17:40:00Z",
        },
        {
          id: "m2",
          from: "advisor",
          text: "Sí Mariana, tengo A54. ¿Lo quieres libre o con algún plan?",
          ts: "2024-05-20T17:41:00Z",
        },
        {
          id: "m3",
          from: "client",
          text: "Libre. ¿Precio y colores?",
          ts: "2024-05-20T17:42:00Z",
        },
        {
          id: "m4",
          from: "advisor",
          text: "Precio $YYY. Colores: negro, violeta y blanco. ¿Cuál te gusta más?",
          ts: "2024-05-20T17:43:00Z",
        },
        {
          id: "m5",
          from: "client",
          text: "Dale, lo reviso y te confirmo.",
          ts: "2024-05-20T17:45:00Z",
        },
      ],
    },
  ],
  adv_2: [
    {
      id: "conv_carlos_1",
      contactName: "José Rivas",
      contactNumber: "+58 424 000 0003",
      lastMessagePreview: "Listo, lo pago hoy. Envíame datos.",
      updatedAt: "2024-05-20T13:20:00Z",
      involvedInAnalysis: true,
      evaluation: {
        tiempo_contacto: true,
        tiempo_respuesta: true,
        tiempo_cotizacion: true,
        cierre_intencion: true,
        ofrecio_scalapay: true,
        mas_dos_opciones: true,
        seguimiento_intencion: true,
        notes: "Excelente cierre. Buen ofrecimiento de financiamiento.",
      },
      messages: [
        {
          id: "m1",
          from: "client",
          text: "Hola, busco un Xiaomi con buena cámara.",
          ts: "2024-05-20T12:58:00Z",
        },
        {
          id: "m2",
          from: "advisor",
          text: "Hola José, te recomiendo Redmi Note 13 Pro o Xiaomi 13T. ¿Qué presupuesto manejas?",
          ts: "2024-05-20T12:59:00Z",
        },
        {
          id: "m3",
          from: "client",
          text: "Entre $200 y $300.",
          ts: "2024-05-20T13:00:00Z",
        },
        {
          id: "m4",
          from: "advisor",
          text: "Perfecto. El Note 13 Pro está en $2XX y el 13T en $2YY. También tienes opción de Scalapay en cuotas.",
          ts: "2024-05-20T13:01:00Z",
        },
        {
          id: "m5",
          from: "client",
          text: "Listo, lo pago hoy. Envíame datos.",
          ts: "2024-05-20T13:03:00Z",
        },
      ],
    },
  ],
};

export function getMockAdvisorById(advisorId) {
  const allAdvisors = Object.values(MOCK_PERFORMANCE_DATA.teams).flat();
  return allAdvisors.find((a) => a.id === advisorId) || null;
}

export function getMockConversationsForAdvisor(advisorId) {
  return MOCK_CONVERSATIONS_BY_ADVISOR[advisorId] || [];
}
