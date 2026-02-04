import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const { evaluations, advisorName } = await request.json();

    if (!evaluations || !Array.isArray(evaluations) || evaluations.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren evaluaciones para generar el reporte' },
        { status: 400 }
      );
    }

    // Calcular estadísticas
    const totalConversations = evaluations.length;
    const metricsCount = {
      tiempo_contacto: 0,
      tiempo_respuesta: 0,
      tiempo_cotizacion: 0,
      cierre_intencion: 0,
      ofrecio_scalapay: 0,
      mas_dos_opciones: 0,
      seguimiento_intencion: 0,
    };

    evaluations.forEach((evaluation) => {
      Object.keys(metricsCount).forEach((key) => {
        if (evaluation[key]) {
          metricsCount[key]++;
        }
      });
    });

    // Calcular porcentajes
    const metricsPercentage = {};
    Object.keys(metricsCount).forEach((key) => {
      metricsPercentage[key] = ((metricsCount[key] / totalConversations) * 100).toFixed(1);
    });

    // Preparar datos para IA
    const statsText = `
Asesor: ${advisorName || 'Sin nombre'}
Total de conversaciones analizadas: ${totalConversations}

Métricas de rendimiento:
- Tiempo de contacto adecuado: ${metricsPercentage.tiempo_contacto}% (${metricsCount.tiempo_contacto}/${totalConversations})
- Tiempo de respuesta rápido: ${metricsPercentage.tiempo_respuesta}% (${metricsCount.tiempo_respuesta}/${totalConversations})
- Tiempo de cotización eficiente: ${metricsPercentage.tiempo_cotizacion}% (${metricsCount.tiempo_cotizacion}/${totalConversations})
- Cierre con intención de compra: ${metricsPercentage.cierre_intencion}% (${metricsCount.cierre_intencion}/${totalConversations})
- Ofrecimiento de Scalapay: ${metricsPercentage.ofrecio_scalapay}% (${metricsCount.ofrecio_scalapay}/${totalConversations})
- Más de dos opciones presentadas: ${metricsPercentage.mas_dos_opciones}% (${metricsCount.mas_dos_opciones}/${totalConversations})
- Seguimiento de intención: ${metricsPercentage.seguimiento_intencion}% (${metricsCount.seguimiento_intencion}/${totalConversations})
`;

    // Prompt para IA
    const systemPrompt = `Eres un analista senior de rendimiento comercial. Tu tarea es generar un reporte ejecutivo basado en métricas de análisis de conversaciones de ventas.

El reporte debe ser profesional, accionable y estar en español. Debes responder ÚNICAMENTE con un JSON válido con la siguiente estructura:

{
  "resumen_ejecutivo": "Párrafo de 3-4 oraciones resumiendo el desempeño general del asesor, destacando puntos fuertes y áreas críticas de mejora.",
  "fortalezas": [
    "Fortaleza 1 detectada (específica y con datos)",
    "Fortaleza 2 detectada",
    "Fortaleza 3 detectada"
  ],
  "areas_mejora": [
    "Área de mejora 1 (específica y con datos)",
    "Área de mejora 2",
    "Área de mejora 3"
  ],
  "plan_accion": [
    "Acción concreta 1 para mejorar el rendimiento",
    "Acción concreta 2",
    "Acción concreta 3"
  ],
  "conclusiones": "Párrafo de cierre con recomendaciones estratégicas y próximos pasos."
}

Basa tu análisis en los porcentajes. Considera:
- Arriba del 80% = Excelente
- Entre 60-80% = Bueno
- Entre 40-60% = Necesita mejora
- Debajo del 40% = Crítico`;

    const userMessage = `Analiza el siguiente rendimiento y genera un reporte ejecutivo profesional:

${statsText}

Genera el reporte en formato JSON.`;

    // Llamar a OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const reportData = JSON.parse(response.choices[0].message.content);

    return NextResponse.json({
      ...reportData,
      metricas_detalladas: metricsPercentage,
      total_conversaciones: totalConversations,
      fecha_generacion: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generando reporte con IA:', error);
    return NextResponse.json(
      { error: 'Error al generar el reporte con IA' },
      { status: 500 }
    );
  }
}
