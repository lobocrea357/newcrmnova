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
        temperature: 0.1, // Baja temperatura para JSON estricto
    }
});

const PROMPT_GERENCIAL = `Eres un experto Auditor de Calidad Comercial para una agencia de viajes.
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
- score debe ser un número entero del 1 al 10 evaluando la calidad general.`;

async function analyzeChatWithGemini(messages, chat) {
    try {
        let maxResponseTime = 0;
        let hasLongDelay = false;
        let longDelayDetails = null;

        const chatMessages = messages.filter(m => m.type === 'text' || m.type === 'image' || m.type === 'audio');

        for (let i = 1; i < chatMessages.length; i++) {
            const prevMsg = chatMessages[i - 1];
            const currMsg = chatMessages[i];

            if (!prevMsg.from_me && currMsg.from_me) {
                const prevTime = new Date(prevMsg.timestamp).getTime();
                const currTime = new Date(currMsg.timestamp).getTime();
                const diffMinutes = (currTime - prevTime) / (1000 * 60);

                if (diffMinutes > maxResponseTime) {
                    maxResponseTime = diffMinutes;
                }

                if (diffMinutes > 30) {
                    hasLongDelay = true;
                    longDelayDetails = `Demora de ${Math.round(diffMinutes)} min después del mensaje del cliente: "${prevMsg.body?.substring(0, 50)}..."`;
                }
            }
        }

        const transcript = chatMessages.map(m => {
            const sender = m.from_me ? 'Asesor (Bot)' : 'Cliente';
            const time = new Date(m.timestamp).toLocaleString();
            return `[${time}] ${sender}: ${m.body || '[Multimedia]'}`;
        }).join('\n');

        const userMessage = `
Aquí tienes la transcripción del chat:
---
${transcript}
---

Información adicional del sistema:
- ¿Hubo demoras de >30 min en responder al cliente?: ${hasLongDelay ? 'SÍ' : 'NO'}
${hasLongDelay ? `- Detalle de la demora: ${longDelayDetails}` : ''}

Analiza y devuelve SOLO el JSON válido.
`;

        const promptFinal = `${PROMPT_GERENCIAL}\n\n${userMessage}`;
        const result = await model.generateContent(promptFinal);
        let aiContent = result.response.text() || '';
        
        aiContent = aiContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        const analysisResult = JSON.parse(aiContent);

        return {
            ...analysisResult,
            maxResponseTime,
            hasLongDelay
        };
    } catch (error) {
        console.error(`[IA Error] Falló el análisis del chat ${chat.id}:`, error.message);
        return null;
    }
}

const { isInternalChat, normalizePhone } = require('./chatFilters');

async function runDailyAudit() {
    console.log(`\n======================================================`);
    console.log(`🤖 [${new Date().toLocaleString()}] INICIANDO ESCÁNER CONTINUO (GEMINI 3.5 FLASH)`);
    console.log(`======================================================\n`);

    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const fortyFiveMinsAgo = new Date(now.getTime() - 45 * 60 * 1000);
        
        const targetDateStr = startOfToday.toISOString().split('T')[0];
        console.log(`📅 Evaluando chats inactivos del día: ${targetDateStr}`);

        // 1. Obtener Bots (Asesores) y números registrados de todo el equipo
        const [{ data: allBots, error: botsError }, { data: allTeam }] = await Promise.all([
            supabase.from('bots').select('id, session_name, phone_number'),
            supabase.from('team_members').select('phone_number')
        ]);
        
        if (botsError) throw botsError;
        
        const botPhonesSet = new Set([
            ...(allBots || []).map(b => normalizePhone(b.phone_number)).filter(Boolean),
            ...(allTeam || []).map(t => normalizePhone(t.phone_number)).filter(Boolean)
        ]);

        const excludedPatterns = [/abraham/i, /paul.*hernandez/i, /test/i, /prueba/i];
        const validBots = (allBots || []).filter(bot => !excludedPatterns.some(p => p.test(bot.session_name || '')));

        for (const bot of validBots) {
            console.log(`\n👨‍💼 Asesor: ${bot.session_name}`);

            // 2. Obtener TODOS los chats del asesor actualizados en el día objetivo
            let query = supabase
                .from('chats')
                .select('id, contact_name, contact_number, is_group, updated_at')
                .eq('bot_id', bot.id)
                .eq('is_group', false);
                
            if (!process.argv.includes('--test')) {
                query = query
                    .gte('updated_at', startOfToday.toISOString())
                    .lte('updated_at', fortyFiveMinsAgo.toISOString());
            } else {
                // En modo prueba, tomamos los chats más recientes
                query = query.order('updated_at', { ascending: false }).limit(5);
            }

            const { data: chats, error: chatsError } = await query;

            if (chatsError) {
                console.error(`❌ Error obteniendo chats:`, chatsError.message);
                continue;
            }

            // Excluir chats internos (staff, pagos, emisiones, otros asesores, grupos)
            const validChats = (chats || []).filter(chat => !isInternalChat(chat, botPhonesSet));

            console.log(`   📝 Encontrados ${validChats.length} chats de clientes para evaluar (${(chats || []).length - validChats.length} internos/grupos descartados).`);
            if (validChats.length === 0) continue;

            const evaluations = [];
            let totalScore = 0;
            let ventasConfirmadas = 0;

            for (const chat of validChats) {
                const { data: messages } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('chat_id', chat.id)
                    .order('timestamp', { ascending: true });

                if (!messages || messages.length < 5) continue;

                // Verificar si ya fue evaluado DESPUÉS de su última actividad
                const { data: existingEval } = await supabase
                    .from('conversation_evaluations')
                    .select('evaluation_date')
                    .eq('chat_id', chat.id)
                    .order('evaluation_date', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                if (existingEval && new Date(existingEval.evaluation_date) >= new Date(chat.updated_at)) {
                    continue; // Ya evaluado después de la última actualización
                }

                console.log(`   🔍 Analizando chat con ${chat.contact_name}...`);
                const analysis = await analyzeChatWithGemini(messages, chat);
                
                if (analysis) {
                    totalScore += analysis.score || 0;
                    if (analysis.sale_completed) ventasConfirmadas++;

                    evaluations.push({
                        chat_id: chat.id,
                        bot_id: bot.id,
                        score: analysis.score || 0,
                        venta_confirmada: analysis.sale_completed || false,
                        ofrecio_scalapay: analysis.kpis?.offered_scalapay || false,
                        cierre_intencion: analysis.kpis?.closing_attempt || false,
                        mas_dos_opciones: analysis.kpis?.offered_options || false,
                        seguimiento_intencion: analysis.kpis?.follow_up_agreed || false,
                        ai_feedback: JSON.stringify(analysis),
                        analysis_method: 'gemini-3.5-flash',
                        generated_by: 'system',
                        evaluation_date: new Date().toISOString()
                    });
                }
                
                // Pequeño delay para no saturar la API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (evaluations.length === 0) {
                console.log(`   ✅ No hay chats nuevos por auditar para ${bot.session_name}.`);
                continue;
            }

            // 3. Buscar si ya existe un Analysis Parent para HOY
            let dbAnalysis;
            const { data: existingAnalysis } = await supabase
                .from('performance_analyses')
                .select('*')
                .eq('bot_id', bot.id)
                .eq('analysis_date', targetDateStr)
                .maybeSingle();
            
            if (existingAnalysis) {
                dbAnalysis = existingAnalysis;
                
                // Actualizar los totales del registro maestro
                const newTotalAnalyzed = dbAnalysis.total_conversations_analyzed + evaluations.length;
                const newVentas = (dbAnalysis.ventas_confirmadas_count || 0) + ventasConfirmadas;
                const newAvgScore = ((dbAnalysis.average_score * dbAnalysis.total_conversations_analyzed) + totalScore) / newTotalAnalyzed;

                await supabase
                    .from('performance_analyses')
                    .update({
                        total_conversations_analyzed: newTotalAnalyzed,
                        ventas_confirmadas_count: newVentas,
                        average_score: newAvgScore,
                        updated_at: now.toISOString()
                    })
                    .eq('id', dbAnalysis.id);

            } else {
                // Crear uno nuevo si es el primero del día
                const avgScore = totalScore / evaluations.length;
                const { data: newAnalysis, error: analysisError } = await supabase
                    .from('performance_analyses')
                    .insert({
                        bot_id: bot.id,
                        analysis_name: `Auditoría Continua - ${targetDateStr}`,
                        analysis_date: targetDateStr,
                        status: 'finalized',
                        finalized_at: now.toISOString(),
                        total_conversations_analyzed: evaluations.length,
                        average_score: avgScore,
                        ventas_confirmadas_count: ventasConfirmadas,
                        generated_by: 'system'
                    })
                    .select()
                    .single();

                if (analysisError) {
                    console.error(`   ❌ Error guardando análisis maestro:`, analysisError.message);
                    continue;
                }
                dbAnalysis = newAnalysis;
            }

            // 4. Guardar cada evaluación hija
            const evalsWithParent = evaluations.map(ev => ({ ...ev, performance_analysis_id: dbAnalysis.id }));
            const { error: evalError } = await supabase.from('conversation_evaluations').insert(evalsWithParent);
            if (evalError) console.error(`   ❌ Error guardando evaluaciones individuales:`, evalError.message);
            else console.log(`   ✅ Guardados ${evaluations.length} análisis para ${bot.session_name} en DB.`);
            
        }
        
        console.log(`\n🎉 Auditoría del día ${targetDateStr} completada exitosamente.`);
    } catch (error) {
        console.error('❌ Error fatal en cron:', error);
    }
}

// Configurar Cron Job (1:00 AM Hora Venezuela)
if (process.argv.includes('--test')) {
    console.log('🛠️ [MODO PRUEBA] Ejecutando auditoría de inmediato...');
    runDailyAudit().then(() => {
        console.log('🏁 Prueba finalizada.');
        process.exit(0);
    });
} else {
    console.log('⏳ AI-Auditor inicializado. Escaneando cada 15 minutos...');
    cron.schedule('*/15 * * * *', runDailyAudit, {
        scheduled: true,
        timezone: "America/Caracas"
    });

    // Iniciar también el generador de Manual de Ventas
    const { generateSalesManual } = require('./generate-manual');
    console.log('⏳ AI Sales Manual inicializado. Generando todos los días a la 1:00 AM...');
    cron.schedule('0 1 * * *', generateSalesManual, {
        scheduled: true,
        timezone: "America/Caracas"
    });

    // Mantener el proceso vivo y manejar cierres graciosos
    process.on('SIGINT', () => {
        console.log('Apagando AI-Auditor...');
        process.exit();
    });
}
