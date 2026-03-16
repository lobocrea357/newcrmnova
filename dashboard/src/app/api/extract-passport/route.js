import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({
        error: 'Image is required',
        details: 'Debes enviar la imagen en base64'
      }, { status: 400 })
    }

    // Construct prompt for passport data extraction
    const systemPrompt = `Eres un experto en extracción de datos de pasaportes internacionales.

Tu tarea es analizar la imagen del pasaporte y extraer ÚNICAMENTE los datos que sean claramente visibles y legibles.

IMPORTANTE:
- Si un campo NO es visible o NO es legible, devuelve null para ese campo
- NO inventes datos
- NO hagas suposiciones
- La zona MRZ (Machine Readable Zone) en la parte inferior del pasaporte contiene la información más importante
- Los nombres suelen estar en el orden: APELLIDOS<<NOMBRES
- La nacionalidad viene en código de 3 letras (VEN = Venezuela, COL = Colombia, USA = Estados Unidos, etc.)
- El sexo es M (masculino) o F (femenino)
- La fecha de nacimiento suele estar en formato YYMMDD en la MRZ

FORMATO DE RESPUESTA (JSON estricto):
{
  "nombres": string | null,
  "apellidos": string | null,
  "numero_pasaporte": string | null,
  "nacionalidad": string | null,
  "sexo": "M" | "F" | null,
  "fecha_nacimiento": string | null,
  "confidence": "high" | "medium" | "low",
  "notes": string
}

Donde:
- nombres: Nombres del titular (pueden ser uno o dos nombres)
- apellidos: Apellidos del titular (pueden ser uno o dos apellidos)
- numero_pasaporte: Número del pasaporte (alfanumérico)
- nacionalidad: Nacionalidad en texto completo (ej: "Venezuela", "Colombia")
- sexo: "M" o "F"
- fecha_nacimiento: Fecha en formato YYYY-MM-DD (convierte desde el formato del pasaporte)
- confidence: Nivel de confianza en la extracción (high si todo es claro, medium si hay dudas, low si la imagen es borrosa)
- notes: Notas adicionales o advertencias (ej: "Imagen borrosa, verificar manualmente", "Algunos campos no visibles")`

    const userMessage = `Analiza esta imagen de pasaporte y extrae los datos solicitados. 
    
RECUERDA: Si un campo no es visible o legible, devuelve null. NO inventes información.`

    // Call OpenAI Vision API with gpt-4o-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userMessage
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
                detail: 'high' // Use high detail for better OCR accuracy
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.1 // Low temperature for more consistent extraction
    })

    const extractedData = JSON.parse(completion.choices[0].message.content)

    return NextResponse.json({
      success: true,
      data: extractedData
    })

  } catch (error) {
    console.error('Error extracting passport data:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
