require('dotenv').config();
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Inicializar Clientes
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleKey = process.env.GOOGLE_API_KEY;

if (!supabaseUrl || !supabaseKey || !googleKey) {
    console.error('❌ Faltan variables de entorno críticas (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_API_KEY).');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(googleKey);
const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
        temperature: 0.2, // Baja temperatura para JSON estricto y coherencia
    }
});

const PROMPT_MANUAL = `Eres el Director Comercial Estratégico de una agencia de viajes.
Tu objetivo es crear un "Manual de Ventas Dinámico" basado en el análisis de decenas de evaluaciones de conversaciones reales de tus asesores.

## TU TAREA
Analizar el historial de evaluaciones proporcionado y extraer la inteligencia colectiva del equipo de ventas para actualizar el manual.

## FORMATO DE RESPUESTA OBLIGATORIO (JSON ESTRÍCTO)
Debe ser un objeto JSON con la siguiente estructura exacta:
{
  "resumen_ejecutivo": "string",
  "top_objeciones": [
    {
      "objecion": "string",
      "frecuencia": "Alta|Media|Baja",
      "mejor_respuesta": "string (ejemplo concreto extraído del análisis)"
    }
  ],
  "salon_de_la_fama": [
    {
      "situacion": "string",
      "tecnica_usada": "string",
      "por_que_funciono": "string"
    }
  ],
  "errores_comunes": [
    {
      "error": "string",
      "consecuencia": "string",
      "como_evitarlo": "string"
    }
  ],
  "guia_scalapay": {
    "mejores_momentos_para_ofrecer": ["string"],
    "argumentos_de_venta": ["string"]
  }
}

## REGLAS
- Responde ÚNICAMENTE con el objeto JSON. Nada de texto antes ni después. Ni siquiera uses markdown.
- Basa tu análisis EXCLUSIVAMENTE en los datos de las evaluaciones proporcionadas. Si no hay datos suficientes para una categoría, inventa buenas prácticas aplicables a una agencia de viajes.
`;

const { isInternalChat, normalizePhone } = require('./chatFilters');

async function generateSalesManual() {
    console.log(`\n======================================================`);
    console.log(`🧠 [${new Date().toLocaleString()}] GENERANDO MANUAL DE VENTAS IA (GEMINI)`);
    console.log(`======================================================\n`);

    try {
        // Cargar teléfonos de bots y staff
        const [{ data: allBots }, { data: allTeam }] = await Promise.all([
            supabase.from('bots').select('phone_number'),
            supabase.from('team_members').select('phone_number')
        ]);
        const botPhonesSet = new Set([
            ...(allBots || []).map(b => normalizePhone(b.phone_number)).filter(Boolean),
            ...(allTeam || []).map(t => normalizePhone(t.phone_number)).filter(Boolean)
        ]);

        // 1. Obtener el último manual para saber si es "primera vuelta" o incremental
        const { data: lastManual } = await supabase
            .from('ai_sales_manual')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let query = supabase
            .from('conversation_evaluations')
            .select('ai_feedback, chats(contact_name, contact_number, is_group)');

        if (lastManual && !process.argv.includes('--force-all')) {
            console.log(`📅 Actualización incremental. Buscando evaluaciones desde: ${lastManual.created_at}`);
            query = query.gte('evaluation_date', lastManual.created_at);
        } else {
            console.log(`📚 Primera vuelta (o forzada). Analizando TODO el historial de evaluaciones.`);
        }

        const { data: rawEvaluations, error: evalError } = await query;

        if (evalError) throw evalError;

        // Filtrar evaluaciones que pertenezcan a chats internos
        const evaluations = (rawEvaluations || []).filter(ev => {
            if (ev.chats && isInternalChat(ev.chats, botPhonesSet)) {
                return false;
            }
            return true;
        });

        if (!evaluations || evaluations.length === 0) {
            console.log(`✅ No hay nuevas evaluaciones válidas de clientes para procesar.`);
            return;
        }

        console.log(`🔍 Consolidando ${evaluations.length} evaluaciones de clientes para la IA...`);
        
        // Extraer los feedbacks JSON
        const rawFeedbacks = evaluations.map(ev => {
            try {
                return JSON.parse(ev.ai_feedback);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        // Limitar la cantidad para no exceder tokens (Gemini 1.5/3.5 tiene mucho contexto, pero es mejor ser eficientes)
        // Agrupamos en bloques de texto
        const contextString = rawFeedbacks.map((f, i) => 
            `Evaluación ${i+1}:\n- Venta concretada: ${f.sale_completed}\n- Razón de fallo: ${f.failure_reason}\n- Rendimiento del asesor: ${f.advisor_performance}\n- Puntos clave: ${(f.key_moments||[]).join(', ')}\n- KPIs: Ofreció Scalapay(${f.kpis?.offered_scalapay}), Intento cierre(${f.kpis?.closing_attempt})`
        ).join('\n\n');

        const userMessage = `
Aquí tienes los datos de las conversaciones evaluadas:
---
${contextString}
---
Analiza estos datos y genera el JSON del Manual de Ventas.
`;

        const promptFinal = `${PROMPT_MANUAL}\n\n${userMessage}`;
        
        console.log(`🤖 Pidiendo a Gemini que redacte el manual...`);
        const result = await model.generateContent(promptFinal);
        let aiContent = result.response.text() || '';
        
        aiContent = aiContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        const manualJson = JSON.parse(aiContent);

        // Guardar en la base de datos
        const { error: insertError } = await supabase
            .from('ai_sales_manual')
            .insert({
                content: manualJson
            });

        if (insertError) throw insertError;

        console.log(`🎉 Manual de Ventas IA guardado exitosamente en la base de datos.`);
    } catch (error) {
        console.error('❌ Error generando el manual:', error);
    }
}

// Configurar Cron Job (1:00 AM Hora Venezuela)
if (process.argv.includes('--test') || process.argv.includes('--force-all')) {
    console.log('🛠️ [MODO PRUEBA] Ejecutando generación de manual de inmediato...');
    generateSalesManual().then(() => {
        console.log('🏁 Prueba finalizada.');
        process.exit(0);
    });
} else if (require.main === module) {
    console.log('⏳ AI Sales Manual inicializado. Generando todos los días a la 1:00 AM...');
    cron.schedule('0 1 * * *', generateSalesManual, {
        scheduled: true,
        timezone: "America/Caracas"
    });
}

module.exports = { generateSalesManual };
