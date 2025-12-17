import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request) {
    try {
        const { messages, customPrompt } = await request.json()

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({
                error: 'Messages array is required',
                details: 'Debes enviar un array de mensajes'
            }, { status: 400 })
        }

        // 2. Calculate Response Times & Detect > 30min delays
        let maxResponseTime = 0
        let hasLongDelay = false
        let longDelayDetails = null

        const chatMessages = messages.filter(m => m.type === 'text' || m.type === 'image' || m.type === 'audio')

        for (let i = 1; i < chatMessages.length; i++) {
            const prevMsg = chatMessages[i - 1]
            const currMsg = chatMessages[i]

            if (!prevMsg.from_me && currMsg.from_me) {
                const prevTime = new Date(prevMsg.timestamp).getTime()
                const currTime = new Date(currMsg.timestamp).getTime()
                const diffMinutes = (currTime - prevTime) / (1000 * 60)

                if (diffMinutes > maxResponseTime) {
                    maxResponseTime = diffMinutes
                }

                if (diffMinutes > 30) {
                    hasLongDelay = true
                    longDelayDetails = `Demora de ${Math.round(diffMinutes)} min después del mensaje del cliente: "${prevMsg.body?.substring(0, 50)}..."`
                }
            }
        }

        // 3. Prepare Transcript
        const transcript = chatMessages.map(m => {
            const sender = m.from_me ? 'Asesor (Bot)' : 'Cliente'
            const time = new Date(m.timestamp).toLocaleString()
            return `[${time}] ${sender}: ${m.body || '[Multimedia]'}`
        }).join('\n')

        // 4. Construct Prompt
        const defaultPrompt = `Eres un experto analista de ventas y calidad de atención al cliente especializado en venta de boletos/tickets de viaje.

Analiza la siguiente conversación de WhatsApp entre un Asesor y un Cliente.

## CRITERIOS PARA DETERMINAR SI LA VENTA SE CONCRETÓ:

Una venta se considera CONCRETADA (sale_completed: true) ÚNICAMENTE cuando se cumplen AMBAS condiciones:
1. **Confirmación de pago**: El cliente realizó el pago (completo o financiado) Y el asesor confirma haberlo recibido/verificado.
2. **Emisión del boleto/ticket**: El asesor menciona que va a emitir, está emitiendo, o ya emitió el boleto/ticket. Frases clave: "voy a emitir", "estás en lista de emisión", "procedo con la emisión", "tu boleto está siendo emitido", etc.

Una venta NO está concretada (sale_completed: false) si:
- Solo hubo cotización o consulta de precios
- El cliente mostró interés pero no pagó
- Hubo negociación pero sin cierre
- El cliente pidió tiempo para pensar
- No hay mención de confirmación de pago NI emisión de boleto

## TU TAREA:
1. Determinar si la venta se concretó según los criterios anteriores
2. Evaluar la calidad de atención del asesor (amabilidad, rapidez, claridad, proactividad)
3. Identificar momentos clave de la conversación
4. Si no hubo venta, explicar brevemente por qué

## FORMATO DE RESPUESTA (JSON estricto):
{
  "sale_completed": boolean,
  "failure_reason": string, // Si sale_completed es false, explica por qué. Si es true, pon "N/A".
  "advisor_performance": string, // Evaluación detallada del desempeño del asesor: puntos fuertes, áreas de mejora, tono, rapidez.
  "key_moments": string[] // Lista de 3-5 momentos importantes de la conversación.
}`

        // Usar customPrompt si viene y no está vacío, sino usar el default
        const systemPrompt = (customPrompt && customPrompt.trim()) ? customPrompt : defaultPrompt

        const userMessage = `
Aquí tienes la transcripción del chat:
---
${transcript}
---

Información adicional del sistema:
- ¿Hubo demoras de >30 min en responder al cliente?: ${hasLongDelay ? 'SÍ' : 'NO'}
${hasLongDelay ? `- Detalle de la demora: ${longDelayDetails}` : ''}

Por favor, analiza la conversación y genera el JSON solicitado.
`

        // 5. Call OpenAI
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            model: 'gpt-3.5-turbo',
            response_format: { type: 'json_object' },
        })

        const analysisResult = JSON.parse(completion.choices[0].message.content)

        // Add system-detected delay info
        analysisResult.system_detected_delay = {
            has_long_delay: hasLongDelay,
            details: longDelayDetails
        }

        return NextResponse.json(analysisResult)

    } catch (error) {
        console.error('Error in AI analysis:', error)
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}
