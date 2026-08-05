import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

let apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    try {
        const envFile = fs.readFileSync('.env.local', 'utf8');
        const match = envFile.match(/GOOGLE_API_KEY=(.+)/);
        if (match) apiKey = match[1].trim();
    } catch(e) {}
}

if (!apiKey) {
    try {
        const envFile = fs.readFileSync('.env', 'utf8');
        const match = envFile.match(/GOOGLE_API_KEY=(.+)/);
        if (match) apiKey = match[1].trim();
    } catch(e) {}
}

if (!apiKey) {
    try {
        const envFile = fs.readFileSync('../.env', 'utf8');
        const match = envFile.match(/GOOGLE_API_KEY=(.+)/);
        if (match) apiKey = match[1].trim();
    } catch(e) {}
}

if (!apiKey) {
    console.error("❌ No encontré la GOOGLE_API_KEY localmente para hacer la prueba. ¿Podrías indicarme dónde la tienes guardada (ej: .env.local, .env en la raíz)?");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("🚀 Probando conexión con gemini-3.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const result = await model.generateContent("Hola, esto es una prueba técnica. Responde únicamente con '¡Gemini 3.5 Flash funciona perfectamente!' si recibes este mensaje.");
        console.log("\n✅ Respuesta del modelo:");
        console.log("------------------------");
        console.log(result.response.text());
        console.log("------------------------\n");
    } catch (err) {
        console.error("\n❌ Falló la prueba con gemini-3.5-flash:");
        console.error(err.message);
        
        console.log("\n⚠️ Intentando con gemini-2.5-flash como fallback para descartar problemas de llave...");
        try {
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const fbResult = await fallbackModel.generateContent("Hola, responde con '2.5 funciona'.");
            console.log("Respuesta 2.5:", fbResult.response.text());
        } catch (e) {
            console.error("También falló el fallback. La API Key podría ser inválida.");
        }
    }
}

run();
