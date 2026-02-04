import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * API Route para analizar múltiples conversaciones en batch
 * Mucho más eficiente que analizar una por una
 */
export async function POST(request) {
  try {
    console.log('🔑 Verificando OPENAI_API_KEY...');
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY NO configurada');
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }
    console.log('✅ OPENAI_API_KEY encontrada (primeros 10 chars):', process.env.OPENAI_API_KEY.substring(0, 10));

    const { conversations } = await request.json();

    if (!conversations || !Array.isArray(conversations) || conversations.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de conversaciones' },
        { status: 400 }
      );
    }

    console.log(`🤖 Analizando ${conversations.length} conversaciones en batch`);
    
    // VALIDACIÓN CRÍTICA: Verificar que las conversaciones tengan mensajes
    const chatsWithMessages = conversations.filter(c => c.messages && c.messages.length > 0);
    const chatsWithoutMessages = conversations.length - chatsWithMessages.length;
    
    if (chatsWithoutMessages > 0) {
      console.error(`❌ ERROR CRÍTICO: ${chatsWithoutMessages}/${conversations.length} conversaciones SIN MENSAJES`);
      console.error('   IDs sin mensajes:', conversations.filter(c => !c.messages || c.messages.length === 0).map(c => c.chat_id));
    }
    
    if (chatsWithMessages.length === 0) {
      return NextResponse.json(
        { error: 'Ninguna conversación tiene mensajes para analizar' },
        { status: 400 }
      );
    }
    
    console.log(`✓ ${chatsWithMessages.length} conversaciones con mensajes disponibles para análisis`);

    // Preparar prompt para análisis en batch (SOLO conversaciones con mensajes)
    const conversationsText = chatsWithMessages.map((conv, index) => {
      const messagesText = conv.messages
        .slice(-20) // Últimos 20 mensajes (más recientes)
        .map(m => `${m.from_me ? 'ASESOR' : 'CLIENTE'}: ${m.text}`)
        .join('\n');

      return `
CONVERSACIÓN ${index + 1}:
ID: ${conv.chat_id}
Contacto: ${conv.contact_name}
Mensajes (${conv.messages.length} total, mostrando últimos 20):
${messagesText}
---`;
    }).join('\n\n');

    const systemPrompt = `Eres un analista de rendimiento comercial experto. Tu tarea es evaluar múltiples conversaciones de ventas de manera consistente y objetiva.

Para CADA conversación, evalúa los siguientes 7 parámetros (true/false):

1. tiempo_contacto: El asesor respondió dentro de las primeras 2-3 horas desde el primer mensaje del cliente
2. tiempo_respuesta: El asesor responde rápidamente (< 10 minutos entre mensajes)
3. tiempo_cotizacion: Si el cliente pidió cotización, el asesor respondió en menos de 1 hora
4. cierre_intencion: El asesor intentó cerrar la venta o programar seguimiento
5. ofrecio_scalapay: El asesor mencionó opciones de financiamiento o pago (Scalapay, cuotas, etc.)
6. mas_dos_opciones: El asesor presentó al menos 2-3 opciones de productos/servicios
7. seguimiento_intencion: El asesor mostró intención de dar seguimiento futuro

Devuelve un JSON con este formato EXACTO:
{
  "evaluations": {
    "chat_id_1": {
      "tiempo_contacto": true,
      "tiempo_respuesta": false,
      "tiempo_cotizacion": true,
      "cierre_intencion": true,
      "ofrecio_scalapay": false,
      "mas_dos_opciones": true,
      "seguimiento_intencion": true,
      "ai_feedback": "Breve análisis de la conversación (2-3 oraciones)"
    },
    "chat_id_2": { ... },
    ...
  }
}

IMPORTANTE:
- Usa los chat_id exactos que se te proporcionan
- Sé consistente en los criterios para todas las conversaciones
- El ai_feedback debe ser breve pero específico`;

    const userMessage = `Analiza las siguientes ${conversations.length} conversaciones y evalúalas según los 7 parámetros:

${conversationsText}

Devuelve el JSON con las evaluaciones.`;

    // Llamar a OpenAI
    console.log('🤖 Llamando a OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k', // Modelo con más contexto
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3, // Más determinístico para consistencia
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    console.log('✅ Respuesta recibida de OpenAI');
    const result = JSON.parse(response.choices[0].message.content);

    console.log(`✅ Análisis batch completado: ${Object.keys(result.evaluations || {}).length} evaluaciones`);

    return NextResponse.json({
      evaluations: result.evaluations || {},
      processed_count: conversations.length,
    });
  } catch (error) {
    console.error('❌ Error en análisis batch:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    });
    
    // Si es error 401, es problema de API key
    if (error.status === 401 || error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'API Key de OpenAI inválida o expirada. Verifica OPENAI_API_KEY en variables de entorno.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: `Error al analizar conversaciones: ${error.message}` },
      { status: 500 }
    );
  }
}
