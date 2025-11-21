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
        const systemPrompt = customPrompt || `Eres un experto analista de ventas y calidad de atención al cliente.
Analiza la siguiente conversación de WhatsApp entre un Asesor y un Cliente.
Tu objetivo es determinar si la venta se concretó, identificar fallos y evaluar la atención.

Debes responder EXCLUSIVAMENTE en formato JSON con la siguiente estructura:
{
  "sale_completed": boolean, // true si hubo venta/acuerdo explícito, false si no.
  "failure_reason": string, // Breve explicación de por qué no se cerró (o "N/A" si se cerró).
  "advisor_performance": string, // Comentarios sobre el desempeño del asesor.
  "key_moments": string[] // Lista de momentos clave.
}
`

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
