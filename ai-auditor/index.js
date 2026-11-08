require('dotenv').config();
const cron = require('node-cron');
const { createClient } = require('./gatewayClient'); // backend propio (gateway NestJS), ya no Supabase
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createModel, evaluateChat, MODEL_NAME } = require('./evaluator');
const { isInternalChat, normalizePhone } = require('./chatFilters');

const googleKey = process.env.GOOGLE_API_KEY;
if (!process.env.SERVICE_EMAIL || !process.env.SERVICE_PASSWORD || !googleKey) {
    console.error('❌ Faltan variables de entorno críticas (SERVICE_EMAIL, SERVICE_PASSWORD, GOOGLE_API_KEY).');
    process.exit(1);
}

const supabase = createClient();
const model = createModel(new GoogleGenerativeAI(googleKey));

const MIN_MESSAGES = 5;          // chats más cortos no se evalúan
const INACTIVE_MINUTES = 45;     // se evalúa cuando el chat lleva este tiempo sin actividad
const EXCLUDED_BOTS = [/abraham/i, /paul.*hernandez/i, /test/i, /prueba/i];
const TZ = 'America/Caracas';

let running = false;

/** Fecha (YYYY-MM-DD) e inicio del día en hora de Venezuela. */
function todayInTz(now = new Date()) {
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    // Venezuela es UTC-4 todo el año (sin horario de verano).
    return { ymd, start: new Date(`${ymd}T00:00:00-04:00`) };
}

/** Recalcula los totales del análisis diario a partir de sus evaluaciones. */
async function refreshDailyAnalysis(analysisId) {
    const { data: evals, error } = await supabase
        .from('conversation_evaluations')
        .select('score, percentage, venta_confirmada, lead_caliente, valor_estimado, tiempo_respuesta, tiempo_cotizacion, cierre_intencion, ofrecio_scalapay, mas_dos_opciones, seguimiento_intencion, lead_respondio, preguntas_negociacion, calidad_cotizacion, seguimiento_efectivo, objeciones_superadas, resultado_comercial')
        .eq('performance_analysis_id', analysisId);
    if (error) throw error;
    // Los chats "no_aplica" (internos, spam, proveedores) no cuentan en las medias.
    const scored = evals.filter((e) => e.resultado_comercial?.estado !== 'no_aplica');
    const n = scored.length || 1;
    const count = (k) => scored.filter((e) => e[k]).length;
    const sum = (k) => scored.reduce((s, e) => s + Number(e[k] || 0), 0);
    const ventas = count('venta_confirmada');
    const estados = {};
    for (const e of evals) {
        const st = e.resultado_comercial?.estado || 'desconocido';
        estados[st] = (estados[st] || 0) + 1;
    }
    const aplicables = scored.length;
    await supabase.from('performance_analyses').update({
        total_conversations_analyzed: scored.length,
        average_score: Math.round((sum('score') / n) * 100) / 100,
        average_percentage: Math.round((sum('percentage') / n) * 100) / 100,
        ventas_confirmadas_count: ventas,
        venta_confirmada_count: ventas,
        leads_calientes_count: count('lead_caliente'),
        valor_total_ventas: sum('valor_estimado'),
        tasa_conversion: aplicables > 0 ? Math.round((ventas / aplicables) * 10000) / 100 : 0,
        tiempo_respuesta_count: count('tiempo_respuesta'),
        cierre_intencion_count: count('cierre_intencion'),
        ofrecio_scalapay_count: count('ofrecio_scalapay'),
        mas_dos_opciones_count: count('mas_dos_opciones'),
        seguimiento_intencion_count: count('seguimiento_intencion'),
        lead_respondio_count: count('lead_respondio'),
        preguntas_negociacion_count: count('preguntas_negociacion'),
        calidad_cotizacion_count: count('calidad_cotizacion'),
        seguimiento_efectivo_count: count('seguimiento_efectivo'),
        objeciones_superadas_count: count('objeciones_superadas'),
        sales_summary: { estados, version: 'v2' },
        updated_at: new Date().toISOString(),
    }).eq('id', analysisId);
}

/** Devuelve (o crea) el análisis diario del bot. */
async function getDailyAnalysis(bot, ymd) {
    const { data: existing } = await supabase
        .from('performance_analyses')
        .select('id')
        .eq('bot_id', bot.id)
        .eq('analysis_date', ymd)
        .maybeSingle();
    if (existing) return existing.id;
    const { data, error } = await supabase
        .from('performance_analyses')
        .insert({
            bot_id: bot.id,
            analysis_name: `Auditoría continua ${ymd}`,
            analysis_date: ymd,
            status: 'finalized',
            finalized_at: new Date().toISOString(),
            total_conversations_analyzed: 0,
            average_score: 0,
            average_percentage: 0,
            generated_by: 'system',
        })
        .select('id')
        .single();
    if (error) throw error;
    return data.id;
}

async function runDailyAudit() {
    if (running) {
        console.log('⏭️  Ciclo anterior todavía en curso; se omite este.');
        return;
    }
    running = true;
    const testMode = process.argv.includes('--test');
    const now = new Date();
    const { ymd, start } = todayInTz(now);
    const inactiveSince = new Date(now.getTime() - INACTIVE_MINUTES * 60 * 1000);
    console.log(`\n🤖 [${now.toISOString()}] Auditoría continua (${MODEL_NAME}) — día ${ymd}`);

    const totals = { evaluados: 0, omitidos: 0, errores: 0 };
    try {
        const [{ data: allBots, error: botsError }, { data: allTeam }] = await Promise.all([
            supabase.from('bots').select('id, session_name, phone_number'),
            supabase.from('team_members').select('phone_number'),
        ]);
        if (botsError) throw botsError;

        const staffPhones = new Set([
            ...(allBots || []).map((b) => normalizePhone(b.phone_number)).filter(Boolean),
            ...(allTeam || []).map((t) => normalizePhone(t.phone_number)).filter(Boolean),
        ]);
        const bots = (allBots || []).filter((b) => !EXCLUDED_BOTS.some((p) => p.test(b.session_name || '')));

        for (const bot of bots) {
            let q = supabase
                .from('chats')
                .select('id, contact_name, contact_number, is_group, updated_at')
                .eq('bot_id', bot.id)
                .eq('is_group', false);
            q = testMode
                ? q.order('updated_at', { ascending: false }).limit(3)
                : q.gte('updated_at', start.toISOString()).lte('updated_at', inactiveSince.toISOString());

            const { data: chats, error: chatsError } = await q;
            if (chatsError) {
                console.error(`❌ ${bot.session_name}: error obteniendo chats: ${chatsError.message}`);
                continue;
            }
            const candidates = (chats || []).filter((c) => !isInternalChat(c, staffPhones));
            if (!candidates.length) continue;

            let analysisId = null;
            let changed = 0;
            for (const chat of candidates) {
                // ¿Ya evaluado tras su última actividad?
                const { data: prev } = await supabase
                    .from('conversation_evaluations')
                    .select('id, evaluation_date')
                    .eq('chat_id', chat.id)
                    .order('evaluation_date', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (prev && new Date(prev.evaluation_date) >= new Date(chat.updated_at)) {
                    totals.omitidos++;
                    continue;
                }

                const { data: messages } = await supabase
                    .from('messages')
                    .select('body, caption, type, from_me, timestamp, metadata')
                    .eq('chat_id', chat.id)
                    .order('timestamp', { ascending: true });
                if (!messages || messages.length < MIN_MESSAGES) continue;

                let row;
                try {
                    row = await evaluateChat(model, messages);
                } catch (e) {
                    totals.errores++;
                    console.error(`   ⚠️  ${bot.session_name} / ${chat.contact_number}: la IA falló (${e.message})`);
                    continue;
                }
                const { _estado, ...fields } = row;

                analysisId = analysisId || (await getDailyAnalysis(bot, ymd));
                const values = {
                    ...fields,
                    chat_id: chat.id,
                    bot_id: bot.id,
                    numero_telefono: chat.contact_number,
                    performance_analysis_id: analysisId,
                    evaluation_date: new Date().toISOString(),
                };

                // Una evaluación por chat y día: si ya hay una de hoy, se actualiza.
                const sameDay = prev && new Date(prev.evaluation_date) >= start;
                const res = sameDay
                    ? await supabase.from('conversation_evaluations').update(values).eq('id', prev.id)
                    : await supabase.from('conversation_evaluations').insert(values);
                if (res.error) {
                    totals.errores++;
                    console.error(`   ❌ No se guardó la evaluación de ${chat.contact_number}: ${res.error.message}`);
                    continue;
                }
                totals.evaluados++;
                changed++;
                console.log(`   ✅ ${bot.session_name} / ${chat.contact_number}: ${fields.percentage}% (${_estado})`);
                await new Promise((r) => setTimeout(r, 600)); // no saturar la API
            }
            if (changed && analysisId) await refreshDailyAnalysis(analysisId);
        }
        console.log(`🏁 Ciclo terminado: ${totals.evaluados} evaluados, ${totals.omitidos} sin cambios, ${totals.errores} errores.`);
    } catch (error) {
        console.error('❌ Error en el ciclo de auditoría:', error.message || error);
    } finally {
        running = false;
    }
}

if (process.argv.includes('--test')) {
    console.log('🛠️ [MODO PRUEBA] Evaluando los 3 chats más recientes de cada bot…');
    runDailyAudit().then(() => process.exit(0));
} else {
    console.log(`⏳ Auditoría IA activa (${MODEL_NAME}). Escaneo cada 15 minutos.`);
    cron.schedule('*/15 * * * *', runDailyAudit, { scheduled: true, timezone: TZ });

    const { generateSalesManual } = require('./generate-manual');
    console.log('⏳ Manual de ventas IA: se genera todos los días a la 1:00 AM.');
    cron.schedule('0 1 * * *', generateSalesManual, { scheduled: true, timezone: TZ });

    process.on('SIGINT', () => process.exit());
    process.on('SIGTERM', () => process.exit());
}

module.exports = { runDailyAudit };
