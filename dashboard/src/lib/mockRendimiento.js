// CRITERIOS DE IA PARA EVALUACIÓN DE RENDIMIENTO
// Estos son los criterios que la IA real deberá usar para evaluar cada parámetro

export const CRITERIOS_IA = {
  tiempo_contacto: {
    descripcion: "Tiempo máximo de 15 minutos para primera respuesta",
    regla:
      "Verificar que el asesor responda el primer mensaje del cliente en máximo 15 minutos",
    cumple_si:
      "El timestamp del primer mensaje del asesor - timestamp del primer mensaje del cliente <= 15 minutos",
  },
  tiempo_respuesta: {
    descripcion: "Tiempo máximo de 15 minutos entre respuestas",
    regla:
      "El asesor no puede tardarse más de 15 minutos en responder cualquier mensaje del cliente",
    cumple_si:
      "Todas las respuestas del asesor ocurren dentro de 15 minutos desde el último mensaje del cliente",
  },
  tiempo_cotizacion: {
    descripcion:
      "Tiempo máximo de 15 minutos desde promesa hasta envío de cotización",
    regla:
      "Detectar mensaje donde asesor promete cotizar, luego verificar que envíe cotización en <= 15 min",
    cumple_si:
      "Timestamp de mensaje con cotización/precio - timestamp de mensaje prometiendo cotizar <= 15 minutos",
    keywords_promesa: [
      "te cotizo",
      "te envío",
      "te mando",
      "te paso",
      "voy a cotizar",
      "haciendo la cotización",
    ],
    keywords_cotizacion: [
      "precio",
      "costo",
      "cotización",
      "$",
      "USD",
      "COP",
      "pesos",
    ],
  },
  cierre_intencion: {
    descripcion: "Asesor realiza acciones de cierre efectivo",
    regla: "Detectar al menos una de estas acciones de cierre",
    cumple_si:
      "Al menos 1 de: enviar método de pago, preguntar visita oficina, ofrecer llamada, pedir pasaporte, preguntar sobre presupuesto, enviar ubicación sede",
    keywords: [
      "método de pago",
      "forma de pago",
      "oficina",
      "sede",
      "llamada",
      "pasaporte",
      "presupuesto",
      "ubicación",
      "dirección",
      "te ajusta",
      "puedes pagar",
    ],
  },
  ofrecio_scalapay: {
    descripcion: "Ofrecer plan de financiamiento Scalapay (NO Salyday)",
    regla: "Detectar mención de Scalapay como opción de financiamiento",
    cumple_si: 'Mensaje contiene "scalapay" o "scala pay"',
    keywords: ["scalapay", "scala pay", "financiamiento", "cuotas"],
  },
  mas_dos_opciones: {
    descripcion: "Asesor presenta más de 2 opciones/cotizaciones al cliente",
    regla: "Detectar múltiples cotizaciones o paquetes ofrecidos",
    cumple_si: "Se detectan 2 o más mensajes con precios/opciones diferentes",
    keywords: [
      "opción",
      "paquete",
      "alternativa",
      "otra opción",
      "también tenemos",
      "puedes elegir",
    ],
  },
  seguimiento_intencion: {
    descripcion: "Asesor hace seguimiento activo buscando cerrar venta",
    regla:
      "Detectar mensajes de seguimiento indagando dudas, rebatiendo objeciones o generando conversación",
    cumple_si:
      "Mensajes con preguntas sobre interés, dudas, objeciones o creando nueva conversación",
    keywords: [
      "alguna duda",
      "qué te parece",
      "te interesa",
      "qué opinas",
      "tienes preguntas",
      "cuéntame",
      "qué necesitas",
      "puedo ayudarte",
    ],
  },
};

export const PARAMETROS_EVALUACION = [
  { key: "tiempo_contacto", label: "Tiempo de contacto", icon: "⏱️" },
  { key: "tiempo_respuesta", label: "Tiempo de respuesta", icon: "⏰" },
  { key: "tiempo_cotizacion", label: "Tiempo de cotización", icon: "📊" },
  { key: "cierre_intencion", label: "Cierre con intención", icon: "🎯" },
  { key: "ofrecio_scalapay", label: "Ofreció Scalapay", icon: "💳" },
  { key: "mas_dos_opciones", label: "Más de 2 opciones", icon: "💡" },
  {
    key: "seguimiento_intencion",
    label: "Seguimiento con intención",
    icon: "📞",
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
  let scoreTotal = 0;

  PARAMETROS_EVALUACION.forEach((param, index) => {
    const valor = random(seed + index) > 0.3;
    evaluacion[param.key] = valor;
    if (valor) scoreTotal++;
  });

  const feedbacks = [
    "El asesor respondió con buena intención pero podría mejorar los tiempos de cotización.",
    "Excelente manejo del cliente, se nota proactividad en el seguimiento.",
    "Se detectó demora en las respuestas iniciales, trabajar en tiempo de contacto.",
    "Buena propuesta de valor pero faltó cerrar con fecha específica.",
    "El asesor manejó bien las objeciones del cliente y ofreció alternativas.",
    "Se recomienda ser más específico con los tiempos de cotización.",
    "Excelente uso de técnicas de cierre, mantener esta práctica.",
  ];

  return {
    ...evaluacion,
    score: scoreTotal,
    maxScore: 7,
    percentage: ((scoreTotal / 7) * 100).toFixed(1),
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
  const scorePromedio =
    Object.values(evaluaciones).reduce((sum, ev) => sum + ev.score, 0) / total;
  const porcentajePromedio = ((scorePromedio / 7) * 100).toFixed(1);

  const parametrosAgrupados = {};
  PARAMETROS_EVALUACION.forEach((param) => {
    parametrosAgrupados[param.key] = {
      label: param.label,
      cumplidos: 0,
      total: total,
    };
  });

  Object.values(evaluaciones).forEach((ev) => {
    PARAMETROS_EVALUACION.forEach((param) => {
      if (ev[param.key]) {
        parametrosAgrupados[param.key].cumplidos++;
      }
    });
  });

  let reporte = `# 📊 REPORTE DE CORRECCIONES DE VENTA\n\n`;
  reporte += `**Asesor:** ${botName}\n`;
  reporte += `**Fecha:** ${new Date().toLocaleDateString("es-ES")}\n`;
  reporte += `**Score Promedio:** ${scorePromedio.toFixed(1)}/7 (${porcentajePromedio}%)\n\n`;
  reporte += `---\n\n`;

  reporte += `## 🎯 Objetivo\n\n`;
  reporte += `Mejorar el filtrado, tiempo de respuesta, tiempo de contacto y tiempo de cotización, post venta.\n\n`;

  reporte += `## 📋 Resumen de Parámetros\n\n`;
  Object.entries(parametrosAgrupados).forEach(([key, data]) => {
    const porcentaje = ((data.cumplidos / data.total) * 100).toFixed(0);
    const emoji = porcentaje >= 70 ? "✅" : porcentaje >= 50 ? "⚠️" : "❌";
    reporte += `${emoji} **${data.label}:** ${data.cumplidos}/${data.total} (${porcentaje}%)\n`;
  });

  reporte += `\n## 📊 Correcciones por Conversación\n\n`;

  conversaciones.slice(0, 5).forEach((conv, index) => {
    const ev = evaluaciones[conv.id];
    if (!ev) return;

    reporte += `### Lead ${index + 1}: ${conv.contact_phone || conv.contact_name}\n\n`;
    reporte += `**Score:** ${ev.score}/7 (${ev.percentage}%)\n\n`;

    const fortalezas = PARAMETROS_EVALUACION.filter((p) => ev[p.key]);
    const mejoras = PARAMETROS_EVALUACION.filter((p) => !ev[p.key]);

    if (fortalezas.length > 0) {
      reporte += `✅ **Fortalezas:**\n`;
      fortalezas.forEach((p) => (reporte += `- ${p.label}\n`));
      reporte += `\n`;
    }

    if (mejoras.length > 0) {
      reporte += `⚠️ **Áreas de mejora:**\n`;
      mejoras.forEach((p) => (reporte += `- ${p.label}\n`));
      reporte += `\n`;
    }

    reporte += `💡 **Análisis IA:** ${ev.ai_feedback}\n\n`;
    reporte += `---\n\n`;
  });

  reporte += `## 💡 Recomendaciones Generales\n\n`;

  const parametrosDebiles = Object.entries(parametrosAgrupados)
    .filter(([_, data]) => data.cumplidos / data.total < 0.6)
    .sort((a, b) => a[1].cumplidos - b[1].cumplidos);

  if (parametrosDebiles.length > 0) {
    reporte += `Se recomienda enfocarse en los siguientes aspectos:\n\n`;
    parametrosDebiles.forEach(([_, data]) => {
      reporte += `- **${data.label}**: Requiere atención prioritaria\n`;
    });
  } else {
    reporte += `El asesor mantiene un desempeño general sólido. Continuar con las prácticas actuales y buscar oportunidades de mejora incremental.\n`;
  }

  reporte += `\n## 📈 Próximos Pasos\n\n`;
  reporte += `1. Revisar estas correcciones con el asesor\n`;
  reporte += `2. Establecer metas específicas para parámetros débiles\n`;
  reporte += `3. Hacer seguimiento en la próxima evaluación\n`;
  reporte += `4. Documentar mejoras observadas\n\n`;

  return reporte;
};
