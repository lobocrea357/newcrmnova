import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno')
}

const openai = new OpenAI({
  apiKey,
})

export async function POST(request) {
  try {
    const { imageBase64, pais } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({
        error: 'Image is required',
        details: 'Debes enviar la imagen en base64'
      }, { status: 400 })
    }

    // Prompt específico para cédulas de identidad
    const systemPrompt = `Eres un experto en extracción de datos de cédulas de identidad de países latinoamericanos.

Tu tarea es analizar la imagen de la cédula y extraer ÚNICAMENTE los datos que sean claramente visibles y legibles.

IMPORTANTE:
- Si un campo NO es visible o NO es legible, devuelve null para ese campo
- NO inventes datos
- NO hagas suposiciones
- Las cédulas tienen diferentes formatos según el país:
  * Venezuela: V-12345678 o E-12345678 (V=venezolano, E=extranjero)
  * Colombia: 10 dígitos numéricos sin guiones
  * Perú: 8 dígitos numéricos (DNI)
  * Ecuador: 10 dígitos numéricos
  * Argentina: 7-8 dígitos numéricos (DNI)
  * Chile: 8-9 dígitos con guion y dígito verificador (12345678-9)
  * Otros países LATAM: formatos variados

- El nombre completo suele estar dividido en nombres y apellidos
- El sexo puede estar como M/F o Masculino/Femenino
- La fecha de nacimiento puede estar en diferentes formatos (DD/MM/YYYY, DD-MM-YYYY, etc.)
- Algunos países incluyen foto, firma, huella dactilar

FORMATO DE RESPUESTA (JSON estricto):
{
  "nombres": string | null,
  "apellidos": string | null,
  "numero_cedula": string | null,
  "nacionalidad": string | null,
  "sexo": "M" | "F" | null,
  "fecha_nacimiento": string | null,
  "pais_emision_cedula": string | null,
  "confidence": "high" | "medium" | "low",
  "notes": string
}

Donde:
- nombres: Nombres del titular (pueden ser uno o dos nombres)
- apellidos: Apellidos del titular (pueden ser uno o dos apellidos)
- numero_cedula: Número de la cédula tal como aparece (con prefijos y guiones si los tiene)
- nacionalidad: Nacionalidad del titular (ej: "Venezolana", "Colombiana")
- sexo: "M" o "F"
- fecha_nacimiento: Fecha en formato YYYY-MM-DD (convierte desde el formato de la cédula)
- pais_emision_cedula: País que emitió la cédula (ej: "Venezuela", "Colombia")
- confidence: Nivel de confianza en la extracción (high si todo es claro, medium si hay dudas, low si la imagen es borrosa)
- notes: Notas adicionales o advertencias (ej: "Imagen borrosa, verificar manualmente", "Cédula antigua, formato diferente")`

    const userMessage = `Analiza esta imagen de cédula de identidad${pais ? ` de ${pais}` : ''} y extrae los datos solicitados.

INSTRUCCIONES ESPECÍFICAS POR PAÍS:
${pais === 'Venezuela' ? `
- El número de cédula venezolana DEBE incluir el prefijo V o E
- Formato típico: V-12345678 (venezolano) o E-12345678 (extranjero)
- Si solo ves números, asume prefijo V
- Extrae el número EXACTAMENTE como aparece en el documento
` : ''}

${pais === 'Colombia' ? `
- El número de cédula colombiana es solo numérico (8-10 dígitos)
- No incluye prefijos ni letras
- Si hay separadores (puntos, guiones), inclúyelos como aparecen
- Extrae el número EXACTAMENTE como aparece en el documento
` : ''}

${pais === 'Perú' ? `
- El DNI peruano tiene 8 dígitos numéricos
- No incluye prefijos ni letras
- Extrae el número EXACTAMENTE como aparece en el documento
` : ''}

${pais === 'Ecuador' ? `
- La cédula ecuatoriana tiene 10 dígitos numéricos
- No incluye prefijos ni letras
- Extrae el número EXACTAMENTE como aparece en el documento
` : ''}

${!pais ? `
- Para países no especificados, extrae el número tal como aparece
- Incluye cualquier prefijo, letra o separador que veas en el documento
` : ''}

RECUERDA: 
- Si un campo no es visible o legible, devuelve null. NO inventes información.
- Convierte la fecha de nacimiento a formato YYYY-MM-DD
- Identifica el país de emisión si es visible en el documento`

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
                detail: 'high'
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.1
    })

    let extractedData
    try {
      extractedData = JSON.parse(completion.choices[0].message.content)
      
      if (!extractedData.confidence) {
        throw new Error('Respuesta de IA inválida: falta campo confidence')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.error('Raw AI response:', completion.choices[0].message.content)
      return NextResponse.json({
        success: false,
        error: 'La IA devolvió una respuesta inválida. Por favor intenta nuevamente.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: extractedData
    })

  } catch (error) {
    console.error('Error extracting cedula data:', error)
    
    const getUserFriendlyError = (err) => {
      if (err.code === 'insufficient_quota') {
        return 'Servicio temporalmente no disponible. Intenta más tarde.'
      }
      if (err.message?.includes('invalid_image')) {
        return 'Formato de imagen no válido. Usa JPG o PNG.'
      }
      if (err.message?.includes('timeout')) {
        return 'La solicitud tardó demasiado. Intenta con una imagen más pequeña.'
      }
      return 'Error al procesar la imagen. Por favor intenta nuevamente.'
    }
    
    return NextResponse.json({
      success: false,
      error: getUserFriendlyError(error),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
