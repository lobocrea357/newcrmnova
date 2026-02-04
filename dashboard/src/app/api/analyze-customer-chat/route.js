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

    const { chat, messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({
        isCustomerChat: false,
        confidence: 0.5,
        reason: 'Sin mensajes para analizar',
      });
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

    const userMessage = `Nombre del contacto: ${chat?.contact_name || chat?.name || 'Sin nombre'}
Número: ${chat?.contact_number || 'N/A'}

Transcripción de los últimos mensajes:
---
${transcript}
---

¿Es este un chat con un cliente real o es interno/administrativo?`;

    // Llamar a OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);

    return NextResponse.json({
      isCustomerChat: result.is_customer_chat || false,
      confidence: result.confidence || 0.5,
      reason: result.reason || 'Análisis completado',
      fromCache: false,
    });
  } catch (error) {
    console.error('Error analizando chat con IA:', error);
    return NextResponse.json(
      {
        isCustomerChat: true, // Por defecto asumir que es cliente
        confidence: 0.5,
        reason: 'Error en análisis, asumiendo cliente',
      },
      { status: 200 } // 200 para no romper el flujo
    );
  }
}
