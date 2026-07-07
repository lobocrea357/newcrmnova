// CRITERIOS DE IA PARA EVALUACIÓN DE RENDIMIENTO
// Estos son los criterios que la IA real deberá usar para evaluar cada parámetro

export const CRITERIOS_IA = {
  tiempo_contacto: {
    descripcion: "Tiempo máximo de 5 minutos para primera respuesta",
    regla: "Verificar que el asesor responda el primer mensaje del cliente en máximo 5 minutos",
    is_critical: true,
  },
  tiempo_respuesta: {
    descripcion: "Tiempo máximo de 5 minutos entre respuestas",
    regla: "El asesor no puede tardarse más de 5 minutos en responder cualquier mensaje del cliente",
    is_critical: true,
  },
  tiempo_cotizacion: {
    descripcion: "Tiempo máximo de 15 minutos para envío de cotización desde que se solicita",
    regla: "Desde que el cliente pide precio/cotización, el asesor tiene máximo 15 min para enviarla",
    is_critical: true,
  },
  lead_respondio: {
    descripcion: "El cliente interactuó con el asesor",
    regla: "Verificar si hay al menos una respuesta del cliente después de la intervención del asesor",
  },
  cierre_intencion: {
    descripcion: "Solicitud de cierre o compromiso",
    regla: "El asesor intentó concretar una cita, llamada o pago",
  },
  ofrecio_scalapay: {
    descripcion: "Ofrecer financiamiento Scalapay",
    regla: "Mención explícita de Scalapay o facilidades de pago",
  },
  mas_dos_opciones: {
    descripcion: "Presentar alternativas al cliente",
    regla: "El asesor ofreció al menos 2 opciones de viaje o paquetes",
  },
  seguimiento_estructurado: {
    descripcion: "Continuidad clara en la venta",
    regla: "El asesor define un próximo paso claro o hace seguimiento después de un tiempo",
  },
  preguntas_negociacion: {
    descripcion: "Preguntas para descubrir necesidades",
    regla: "El asesor indaga sobre presupuesto, fechas, gustos o acompañantes",
  },
  calidad_cotizacion: {
    descripcion: "Información completa y profesional",
    regla: "La cotización incluye detalles, itinerario o valor agregado, no solo el precio",
  },
  manejo_objeciones: {
    descripcion: "Capacidad de rebatir dudas",
    regla: "El asesor responde profesionalmente a dudas de precio, tiempo o comparaciones",
  },
  venta: {
    descripcion: "Cierre exitoso o reserva",
    regla: "Se confirma la intención final de compra o el pago",
  }
};

export const PARAMETROS_EVALUACION = [
  // Críticos (Tiempos)
  {
    key: "tiempo_contacto",
    label: "Tiempo de contacto (5m)",
    icon: "⏱️",
    weight: 2.0,
    isCritical: true,
  },
  {
    key: "tiempo_respuesta",
    label: "Tiempo de respuesta (5m)",
    icon: "⏰",
    weight: 2.0,
    isCritical: true,
  },
  {
    key: "tiempo_cotizacion",
    label: "Tiempo de cotización (15m)",
    icon: "📊",
    weight: 2.0,
    isCritical: true,
  },
  // Auditoría Comercial
  {
    key: "lead_respondio",
    label: "Lead respondió",
    icon: "💬",
    weight: 4 / 9,
    isCritical: false,
  },
  {
    key: "cierre_intencion",
    label: "Cierre con intención",
    icon: "🎯",
    weight: 4 / 9,
    isCritical: false,
  },
  {
    key: "ofrecio_scalapay",
    label: "Ofreció Scalapay / Financiamiento",
    icon: "💳",
    weight: 4 / 9,
    isCritical: false,
  },
  {
    key: "mas_dos_opciones",
    label: "Más de 2 opciones",
    icon: "💡",
    weight: 4 / 9,
    isCritical: false,
  },
  {
    key: "seguimiento_efectivo",
    label: "Seguimiento Estructurado",
    icon: "📞",
    weight: 4 / 9,
    isCritical: false,
  },
  {
    key: "preguntas_negociacion",
    label: "Preguntas de Negociación",
    icon: "❓",
    weight: 4 / 9,
    isCritical: false,
  },
  {
    key: "calidad_cotizacion",
    label: "Calidad de cotizaciones",
    icon: "✨",
    weight: 4 / 9,
    isCritical: false,
  },
  {
    key: "objeciones_superadas",
    label: "Manejo de objeciones",
    icon: "🛡️",
    weight: 4 / 9,
    isCritical: false,
  },
  {
    key: "venta_confirmada",
    label: "Venta",
    icon: "💰",
    weight: 4 / 9,
    isCritical: false,
  },
  // Información (No suma puntaje)
  {
    key: "numero_telefono",
    label: "Número de Teléfono",
    icon: "📱",
    weight: 0,
    isInfo: true,
  },
];

export const generarEvaluacionMock = (chatId, messages = []) => {
  const random = (seed) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const seed = chatId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const evaluacion = {};
  
  // Incluir info de teléfono (no suma puntos)
  evaluacion.numero_telefono = `+57 3${Math.floor(random(seed) * 900000000 + 100000000)}`;

  // Evaluar parámetros (excluyendo Info)
  const evaluables = PARAMETROS_EVALUACION.filter(p => !p.isInfo);
  
  evaluables.forEach((param, index) => {
    // Un poco de lógica para que los críticos fallen a veces
    const threshold = param.isCritical ? 0.4 : 0.3;
    evaluacion[param.key] = random(seed + index) > threshold;
  });

  // Calcular score ponderado
  const críticos = evaluables.filter(p => p.isCritical);
  const otros = evaluables.filter(p => !p.isCritical);
  
  const scoreCríticos = críticos.reduce((sum, p) => sum + (evaluacion[p.key] ? 2.0 : 0), 0);
  const scoreOtros = otros.reduce((sum, p) => sum + (evaluacion[p.key] ? (4.0 / otros.length) : 0), 0);
  
  const scoreFinal = (scoreCríticos + scoreOtros).toFixed(1);

  const feedbacks = [
    "El asesor respondió con buena intención pero falló en el tiempo crítico de contacto.",
    "Excelente manejo del cliente, se nota proactividad en el seguimiento y cierre.",
    "Se detectó demora en las respuestas iniciales (crítico), trabajar en la inmediatez.",
    "Buena propuesta de valor pero faltó ofrecer Scalapay para facilitar el cierre.",
    "El asesor manejó bien las objeciones y presentó múltiples opciones rápidamente.",
    "Se recomienda ser más específico con los detalles de la cotización enviada.",
    "Excelente uso de técnicas de negociación y preguntas estructurales.",
  ];

  return {
    ...evaluacion,
    score: parseFloat(scoreFinal),
    maxScore: 10,
    percentage: parseFloat(scoreFinal) * 10,
    ai_feedback: feedbacks[Math.floor(random(seed + 100) * feedbacks.length)],
    manually_edited: false,
    fecha_analisis: new Date().toISOString(),
    generated_by: "AI",
  };
};

export const simularAnalisisIA = async (conversaciones, onProgress) => {
  const evaluaciones = {};

  for (let i = 0; i < conversaciones.length; i++) {
    const conv = conversaciones[i];

    await new Promise((resolve) => setTimeout(resolve, 800));

    evaluaciones[conv.id] = generarEvaluacionMock(conv.id, []);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: conversaciones.length,
        chatId: conv.id,
        contactName: conv.contact_name || conv.contact_phone,
      });
    }
  }

  return evaluaciones;
};

export const generarReporteMock = (evaluaciones, conversaciones, botName) => {
  const total = Object.keys(evaluaciones).length;
  if (total === 0) return "No hay datos para generar el reporte.";

  const scorePromedio =
    Object.values(evaluaciones).reduce((sum, ev) => sum + ev.score, 0) / total;
  const porcentajePromedio = (scorePromedio * 10).toFixed(1);

  const parametrosAgrupados = {};
  // Solo evaluables para el conteo de cumplimiento
  const evaluables = PARAMETROS_EVALUACION.filter(p => !p.isInfo);
  
  evaluables.forEach((param) => {
    parametrosAgrupados[param.key] = {
      label: param.label,
      cumplidos: 0,
      total: total,
      isCritical: param.isCritical
    };
  });

  Object.values(evaluaciones).forEach((ev) => {
    evaluables.forEach((param) => {
      if (ev[param.key]) {
        parametrosAgrupados[param.key].cumplidos++;
      }
    });
  });

  let reporte = `# 📊 AUDITORÍA DE VENTAS PREMIUM\n\n`;
  reporte += `**Asesor:** ${botName}\n`;
  reporte += `**Fecha:** ${new Date().toLocaleDateString("es-ES")}\n`;
  reporte += `**Puntuación General:** ${scorePromedio.toFixed(1)}/10 (${porcentajePromedio}%)\n\n`;
  reporte += `---\n\n`;

  reporte += `## 🚨 KPIs Críticos (60% del Peso)\n\n`;
  evaluables.filter(p => p.isCritical).forEach(p => {
    const data = parametrosAgrupados[p.key];
    const porcentaje = ((data.cumplidos / data.total) * 100).toFixed(0);
    const emoji = porcentaje >= 90 ? "✅" : "❌";
    reporte += `${emoji} **${data.label}:** ${porcentaje}% de cumplimiento\n`;
  });

  reporte += `\n## 📋 Auditoría Comercial (40% del Peso)\n\n`;
  evaluables.filter(p => !p.isCritical).forEach(p => {
    const data = parametrosAgrupados[p.key];
    const porcentaje = ((data.cumplidos / data.total) * 100).toFixed(0);
    const emoji = porcentaje >= 70 ? "🟢" : porcentaje >= 40 ? "🟡" : "🔴";
    reporte += `${emoji} **${data.label}:** ${porcentaje}%\n`;
  });

  reporte += `\n## 📊 Análisis por Conversación (Muestra)\n\n`;

  conversaciones.slice(0, 5).forEach((conv, index) => {
    const ev = evaluaciones[conv.id];
    if (!ev) return;

    reporte += `### Auditoría Case #${index + 1}: ${ev.numero_telefono}\n\n`;
    reporte += `**Score:** ${ev.score}/10 | **Status:** ${ev.score >= 7 ? "PASA" : "FALLA"}\n\n`;

    const criticosFallidos = evaluables.filter(p => p.isCritical && !ev[p.key]);
    if (criticosFallidos.length > 0) {
      reporte += `❌ **ALERTA CRÍTICA:** Falló en ${criticosFallidos.map(p => p.label).join(", ")}\n\n`;
    }

    reporte += `💡 **Análisis IA:** ${ev.ai_feedback}\n\n`;
    reporte += `---\n\n`;
  });

  return reporte;
};
