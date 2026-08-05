import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GOOGLE_API_KEY no encontrada en el entorno de Next.js' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        
        const result = await model.generateContent("Esto es una prueba. Responde únicamente: '¡Gemini 3.5 Flash funciona perfectamente!'");
        const text = result.response.text();

        return NextResponse.json({ success: true, message: text, usedModel: "gemini-3.5-flash" });
    } catch (error) {
        // Fallback test
        try {
            const apiKey = process.env.GOOGLE_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const fbModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const fbResult = await fbModel.generateContent("Prueba fallback. Responde '2.5 funciona'.");
            return NextResponse.json({ 
                error: error.message, 
                fallbackSuccess: true, 
                fallbackMessage: fbResult.response.text() 
            }, { status: 500 });
        } catch(fallbackError) {
            return NextResponse.json({ 
                error: error.message, 
                fallbackError: fallbackError.message 
            }, { status: 500 });
        }
    }
}
