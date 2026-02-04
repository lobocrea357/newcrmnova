import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { evaluateAllSalesParameters, generateSalesRecommendations } from '@/lib/salesDetection';

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

    const { messages, contact_info, use_local_analysis = false } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({
        error: 'Se requieren mensajes para el análisis'
      }, { status: 400 });
    }

    // OPCIÓN 1: Usar análisis local (más rápido, más económico)
    if (use_local_analysis) {
      const localEvaluation = evaluateAllSalesParameters(messages);
      const recommendations = generateSalesRecommendations(localEvaluation, messages);

      return NextResponse.json({
        ...localEvaluation,
        recommendations,
        analysis_method: 'local',
        contact_name: contact_info?.contact_name || 'Cliente',
        contact_number: contact_info?.contact_number || 'N/A'
      });
    }

    // OPCIÓN 2: Usar OpenAI para análisis más profundo
    const transcript = messages
      .map((m) => {
        const sender = m.from_me ? 'Asesor' : 'Cliente';
        const content = m.body || m.content || '[Multimedia/Archivo]';
        const timestamp = m.timestamp ? new Date(m.timestamp * 1000).toLocaleTimeString('es-ES') : '';
        return `${timestamp} ${sender}: ${content}`;
      })
      .join('\n');

    const systemPrompt = `Eres un experto analista de ventas especializado en conversaciones de WhatsApp.

Tu tarea es analizar esta conversación y determinar específicamente:

1. VENTA CONFIRMADA: ¿El cliente confirmó explícitamente una compra/reserva?
2. LEAD CALIENTE: ¿Mostró alto interés pidiendo detalles, precios, condiciones?
3. COTIZACIÓN ENVIADA: ¿El asesor proporcionó precios específicos?
4. MÉTODO DE PAGO: ¿Se facilitaron formas de pago concretas?
5. OBJECIONES MANEJADAS: ¿El asesor superó dudas/objeciones del cliente?
6. SEGUIMIENTO EFECTIVO: ¿Hubo seguimiento proactivo y profesional?
7. URGENCIA CREADA: ¿Se generó sensación de urgencia o escasez?
8. VALOR AGREGADO: ¿Se comunicaron beneficios únicos del servicio?

Para cada criterio, identifica:
- Si se cumplió (true/false)
- Nivel de confianza (0.0 - 1.0)
- Evidencia específica (texto del mensaje)

IMPORTANTE:
- Una VENTA CONFIRMADA requiere palabras como: "confirmo", "reservo", "acepto", "dale", "perfecto", "sí quiero", "procede"
- Un LEAD CALIENTE pregunta por: precios, condiciones, cuándo, cómo, requisitos, financiación
- Analiza el contexto completo, no solo palabras sueltas

Responde ÚNICAMENTE con un JSON válido:`;

    const userMessage = `Contacto: ${contact_info?.contact_name || 'Cliente'} (${contact_info?.contact_number || 'N/A'})

Conversación:
---
${transcript}
---

Analiza esta conversación de ventas y proporciona el análisis detallado en formato JSON:

{
  "venta_confirmada": boolean,
  "venta_confirmada_confidence": number,
  "venta_confirmada_evidencia": "texto específico",

  "lead_caliente": boolean,
  "lead_caliente_confidence": number,
  "lead_caliente_evidencia": "texto específico",

  "cotizacion_enviada": boolean,
  "cotizacion_enviada_confidence": number,
  "cotizacion_enviada_evidencia": "texto específico",

  "metodo_pago_enviado": boolean,
  "metodo_pago_enviado_confidence": number,
  "metodo_pago_enviado_evidencia": "texto específico",

  "objeciones_superadas": boolean,
  "objeciones_superadas_confidence": number,
  "objeciones_superadas_evidencia": "texto específico",

  "seguimiento_efectivo": boolean,
  "seguimiento_efectivo_confidence": number,
  "seguimiento_efectivo_evidencia": "texto específico",

  "urgencia_creada": boolean,
  "urgencia_creada_confidence": number,
  "urgencia_creada_evidencia": "texto específico",

  "valor_agregado": boolean,
  "valor_agregado_confidence": number,
  "valor_agregado_evidencia": "texto específico",

  "valor_venta": number|null,
  "interest_level": "alto|medio|bajo",
  "exitos_asesor": ["éxito1", "éxito2"],
  "errores_criticos": ["error1", "error2"],
  "siguiente_accion": "recomendación específica",
  "resumen_conversacion": "breve resumen del desarrollo de la conversación"
}`;

    // Llamar a OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const aiResult = JSON.parse(response.choices[0].message.content);

    // Calcular score basado en parámetros cumplidos
    const parametros = [
      'venta_confirmada', 'lead_caliente', 'cotizacion_enviada',
      'metodo_pago_enviado', 'objeciones_superadas', 'seguimiento_efectivo',
      'urgencia_creada', 'valor_agregado'
    ];

    let scoreVentas = 0;
    const pesos = {
      venta_confirmada: 10,
      lead_caliente: 8,
      cotizacion_enviada: 6,
      metodo_pago_enviado: 7,
      objeciones_superadas: 8,
      seguimiento_efectivo: 6,
      urgencia_creada: 5,
      valor_agregado: 7
    };

    const maxScoreVentas = Object.values(pesos).reduce((sum, peso) => sum + peso, 0);

    parametros.forEach(param => {
      if (aiResult[param]) {
        scoreVentas += pesos[param] || 1;
      }
    });

    // Generar recomendaciones basadas en el análisis IA
    const recommendations = {
      exitos: aiResult.exitos_asesor || [],
      errores: aiResult.errores_criticos || [],
      siguiente_accion: aiResult.siguiente_accion || 'Continuar seguimiento'
    };

    return NextResponse.json({
      ...aiResult,
      score_ventas: scoreVentas,
      max_score_ventas: maxScoreVentas,
      percentage_ventas: ((scoreVentas / maxScoreVentas) * 100).toFixed(1),
      es_venta: aiResult.venta_confirmada === true,
      es_lead_caliente: aiResult.lead_caliente === true,
      recommendations,
      analysis_method: 'openai',
      contact_name: contact_info?.contact_name || 'Cliente',
      contact_number: contact_info?.contact_number || 'N/A'
    });

  } catch (error) {
    console.error('Error en análisis de ventas con IA:', error);

    // Fallback: usar análisis local si OpenAI falla
    try {
      const { messages, contact_info } = await request.json();
      const localEvaluation = evaluateAllSalesParameters(messages);
      const recommendations = generateSalesRecommendations(localEvaluation, messages);

      return NextResponse.json({
        ...localEvaluation,
        recommendations,
        analysis_method: 'local_fallback',
        contact_name: contact_info?.contact_name || 'Cliente',
        contact_number: contact_info?.contact_number || 'N/A',
        warning: 'OpenAI no disponible, usando análisis local'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        {
          error: 'Error en análisis de ventas',
          details: error.message
        },
        { status: 500 }
      );
    }
  }
}
