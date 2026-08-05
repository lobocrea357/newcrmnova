import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request) {
    try {
        const { messages, customPrompt } = await request.json()

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({
                error: 'Messages array is required',
                details: 'Debes enviar un array de mensajes'
            }, { status: 400 })
        }
        
        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ error: 'GOOGLE_API_KEY is not configured' }, { status: 500 })
        }

        // 1. Calculate Response Times & Detect > 30min delays
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

        // 2. Prepare Transcript
        const transcript = chatMessages.map(m => {
            const sender = m.from_me ? 'Asesor (Bot)' : 'Cliente'
            const time = new Date(m.timestamp).toLocaleString()
            return `[${time}] ${sender}: ${m.body || '[Multimedia]'}`
        }).join('\n')

        // 3. Construct Prompt
        const defaultPrompt = `Eres un experto Auditor de Calidad Comercial para una agencia de viajes.
Analiza la siguiente conversación de WhatsApp entre un Asesor y un Cliente.

## TU TAREA
Evaluar estrictamente los KPIs del asesor y determinar por qué se ganó o se perdió la venta.

## CRITERIOS PARA DETERMINAR SI LA VENTA SE CONCRETÓ:
Una venta se considera CONCRETADA (sale_completed: true) ÚNICAMENTE cuando hay confirmación de pago Y emisión de boleto.

## FORMATO DE RESPUESTA OBLIGATORIO (JSON ESTRÍCTO)
{
  "sale_completed": boolean,
  "failure_reason": string,
  "advisor_performance": string,
  "key_moments": [ "string" ],
  "kpis": {
    "offered_scalapay": boolean,
    "offered_options": boolean,
    "closing_attempt": boolean,
    "follow_up_agreed": boolean
  },
  "score": number
}

## REGLAS
- Responde ÚNICAMENTE con el objeto JSON. Nada de texto antes ni después. Ni siquiera uses markdown (no pongas \`\`\`json).
- En failure_reason pon "N/A" si la venta se completó.
- score debe ser un número entero del 1 al 10 evaluando la calidad general.`

        const systemPrompt = (customPrompt && customPrompt.trim()) ? customPrompt : defaultPrompt

        const userMessage = `
Aquí tienes la transcripción del chat:
---
${transcript}
---

Información adicional del sistema:
- ¿Hubo demoras de >30 min en responder al cliente?: ${hasLongDelay ? 'SÍ' : 'NO'}
${hasLongDelay ? `- Detalle de la demora: ${longDelayDetails}` : ''}

Analiza y devuelve SOLO el JSON válido.
`

        // 4. Call Gemini 1.5 Flash
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-3.5-flash',
            generationConfig: {
                temperature: 0.1, // Baja temperatura para JSON estricto
            }
        })
        
        const promptFinal = `${systemPrompt}\n\n${userMessage}`
        const result = await model.generateContent(promptFinal)
        let aiContent = result.response.text() || ''
        
        // 5. Clean and Parse JSON
        aiContent = aiContent.replace(/```json/gi, '').replace(/```/g, '').trim()
        
        let analysisResult
        try {
            analysisResult = JSON.parse(aiContent)
        } catch (parseError) {
            console.error('Error parsing Gemini JSON output:', aiContent)
            throw new Error('La IA no devolvió un JSON válido.')
        }

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
