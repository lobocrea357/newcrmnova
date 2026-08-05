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
        const envFile = fs.readFileSync('dashboard/.env', 'utf8');
        const match = envFile.match(/GOOGLE_API_KEY=(.+)/);
        if (match) apiKey = match[1].trim();
    } catch(e) {}
}

if (!apiKey) {
    console.error("❌ No encontré la GOOGLE_API_KEY localmente.");
    process.exit(1);
}

// Limpiar comillas si las hay
apiKey = apiKey.replace(/['"]/g, '');

async function run() {
    try {
        console.log("🚀 Probando conexión con gemini-3.5-flash usando fetch nativo...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hola, esto es una prueba técnica. Responde únicamente con '¡Gemini 3.5 Flash funciona perfectamente!' si recibes este mensaje." }]
                }]
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Status ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        console.log("\n✅ Respuesta del modelo:");
        console.log("------------------------");
        console.log(text.trim());
        console.log("------------------------\n");
    } catch (err) {
        console.error("\n❌ Falló la prueba con gemini-3.5-flash:");
        console.error(err.message);
    }
}

run();
