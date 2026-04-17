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

    const systemPrompt = `Eres un auditor de rendimiento comercial de élite. Tu tarea es auditar múltiples conversaciones de ventas de manera extremadamente rigurosa y objetiva.

Para CADA conversación, evalúa los siguientes parámetros (devuelve true/false):

CRÍTICOS (TIEMPOS):
1. tiempo_contacto: El asesor respondió el PRIMER mensaje del cliente en menos de 5 minutos.
2. tiempo_respuesta: El asesor mantuvo un ritmo de respuesta menor a 5 minutos entre mensajes durante toda la charla.
3. tiempo_cotizacion: Desde que el cliente pidió precio o cotización, el asesor la envió en menos de 15 minutos.

AUDITORÍA COMERCIAL:
4. lead_respondio: El cliente respondió al menos una vez al asesor.
5. cierre_intencion: El asesor intentó activamente concretar un cierre (cita, pago, reserva, llamada).
6. ofrecio_scalapay: El asesor mencionó explícitamente "Scalapay" o opciones de financiamiento.
7. mas_dos_opciones: El asesor presentó al menos 2-3 opciones o paquetes diferentes al cliente.
8. seguimiento_estructurado: El asesor definió un paso siguiente claro o hizo seguimiento después de una pausa.
9. preguntas_negociacion: El asesor hizo preguntas para descubrir necesidades (presupuesto, acompañantes, fechas).
10. calidad_cotizacion: La información enviada es profesional, detallada y aporta valor (no solo el precio).
11. manejo_objeciones: El asesor respondió con argumentos sólidos a dudas o "peros" del cliente.
12. venta: Se concretó una intención clara de compra, reserva o se confirmó el pago.

Devuelve un JSON con este formato EXACTO:
{
  "evaluations": {
    "chat_id_1": {
      "tiempo_contacto": true,
      "tiempo_respuesta": false,
      "tiempo_cotizacion": true,
      "lead_respondio": true,
      "cierre_intencion": true,
      "ofrecio_scalapay": false,
      "mas_dos_opciones": true,
      "seguimiento_efectivo": true,
      "preguntas_negociacion": true,
      "calidad_cotizacion": true,
      "objeciones_superadas": true,
      "venta_confirmada": false,
      "ai_feedback": "Análisis profesional breve resaltando por qué falló o cumplió lo más relevante."
    },
    ...
  }
}

IMPORTANTE:
- Sé extremadamente estricto con los tiempos. Si el cliente escribe a las 10:00 y el asesor a las 10:06, tiempo_contacto es FALSE.
- Usa los chat_id exactos.`;

    const userMessage = `Analiza estas conversaciones y audítalas según los 12 parámetros comerciales:

${conversationsText}

Devuelve el JSON de auditoría.`;

    // Llamar a OpenAI
    console.log('🤖 Llamando a OpenAI API (gpt-4o-mini)...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2, 
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
