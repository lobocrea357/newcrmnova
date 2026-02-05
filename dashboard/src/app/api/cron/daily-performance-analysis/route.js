import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar SERVICE_ROLE_KEY para bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Endpoint para análisis automático diario de rendimiento
 * Se ejecuta a las 24:00 mediante cron job
 * Analiza las últimas 20 conversaciones de cada asesor activo
 */
export async function GET(request) {
    try {
        console.log('🤖 Iniciando análisis automático diario...');

        // Verificar autenticación (cron secret)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const today = new Date().toISOString().split('T')[0];
        const results = {
            date: today,
            totalAdvisors: 0,
            analyzed: 0,
            failed: 0,
            skipped: 0,
            details: []
        };

        // 1. Obtener todos los bots activos (asesores)
        const { data: bots, error: botsError } = await supabase
            .from('bots')
            .select('id, session_name, phone_number, status')
            .eq('status', 'active')
            .order('session_name');

        if (botsError) {
            console.error('Error obteniendo bots:', botsError);
            throw botsError;
        }

        console.log(`📊 Bots activos encontrados: ${bots.length}`);
        results.totalAdvisors = bots.length;

        // Filtrar bots de prueba
        const excludedPatterns = [
            /abraham/i,
            /abrahama/i,
            /paul.*hernandez/i,
            /test/i,
            /prueba/i
        ];

        const validBots = bots.filter(bot => {
            const sessionName = bot.session_name || '';
            return !excludedPatterns.some(pattern => pattern.test(sessionName));
        });

        console.log(`✅ Bots válidos para análisis: ${validBots.length}`);

        // 2. Procesar cada bot
        for (const bot of validBots) {
            try {
                console.log(`\n📱 Analizando: ${bot.session_name}`);

                const botResult = {
                    botId: bot.id,
                    botName: bot.session_name,
                    status: 'processing'
                };

                // Verificar si ya existe análisis para hoy
                const { data: existingAnalysis } = await supabase
                    .from('performance_analyses')
                    .select('id')
                    .eq('bot_id', bot.id)
                    .gte('created_at', `${today}T00:00:00`)
                    .lte('created_at', `${today}T23:59:59`)
                    .single();

                if (existingAnalysis) {
                    console.log(`   ⏭️ Ya existe análisis para hoy`);
                    botResult.status = 'skipped';
                    botResult.reason = 'Análisis ya existe para hoy';
                    results.skipped++;
                    results.details.push(botResult);
                    continue;
                }

                // 3. Obtener últimas 20 conversaciones del bot
                const { data: chats, error: chatsError } = await supabase
                    .from('chats')
                    .select(`
            id,
            chat_id,
            contact_name,
            contact_number,
            is_group,
            ai_analysis,
            created_at,
            updated_at
          `)
                    .eq('bot_id', bot.id)
                    .eq('is_group', false)
                    .order('updated_at', { ascending: false })
                    .limit(30); // Obtener 30 para filtrar a 20 válidos

                if (chatsError) {
                    console.error(`   ❌ Error obteniendo chats:`, chatsError);
                    botResult.status = 'failed';
                    botResult.error = chatsError.message;
                    results.failed++;
                    results.details.push(botResult);
                    continue;
                }

                if (!chats || chats.length === 0) {
                    console.log(`   ⚠️ No hay chats para analizar`);
                    botResult.status = 'skipped';
                    botResult.reason = 'Sin conversaciones';
                    results.skipped++;
                    results.details.push(botResult);
                    continue;
                }

                // 4. Filtrar chats válidos (excluir grupos, internos, etc.)
                const validChats = chats
                    .filter(chat => {
                        // Excluir grupos
                        if (chat.is_group) return false;

                        // Excluir por patrones en nombre
                        const name = (chat.contact_name || '').toLowerCase();
                        const internalPatterns = [
                            /^\\d+$/,
                            /grupo/i,
                            /equipo/i,
                            /staff/i,
                            /gerencia/i
                        ];

                        return !internalPatterns.some(pattern => pattern.test(name));
                    })
                    .slice(0, 20); // Tomar solo las primeras 20

                console.log(`   📝 Chats válidos: ${validChats.length}`);

                if (validChats.length === 0) {
                    botResult.status = 'skipped';
                    botResult.reason = 'Sin chats válidos después de filtros';
                    results.skipped++;
                    results.details.push(botResult);
                    continue;
                }

                // 5. Obtener mensajes de cada chat y crear evaluaciones
                const evaluations = [];

                for (const chat of validChats) {
                    try {
                        // Obtener mensajes del chat
                        const { data: messages } = await supabase
                            .from('messages')
                            .select('*')
                            .eq('chat_id', chat.id)
                            .order('timestamp', { ascending: true });

                        if (!messages || messages.length < 5) {
                            console.log(`   ⏭️ Chat ${chat.contact_name}: menos de 5 mensajes`);
                            continue;
                        }

                        // Analizar conversación con IA
                        const analysis = await analyzeConversationWithAI(messages, chat);

                        if (analysis) {
                            evaluations.push({
                                chat_id: chat.id,
                                bot_id: bot.id,
                                conversation_id: chat.id,

                                // Métricas de rendimiento
                                tiempo_contacto: analysis.tiempo_contacto || false,
                                tiempo_respuesta: analysis.tiempo_respuesta || false,
                                tiempo_cotizacion: analysis.tiempo_cotizacion || false,
                                cierre_intencion: analysis.cierre_intencion || false,
                                ofrecio_scalapay: analysis.ofrecio_scalapay || false,
                                mas_dos_opciones: analysis.mas_dos_opciones || false,
                                seguimiento_intencion: analysis.seguimiento_intencion || false,

                                // Métricas de ventas
                                venta_confirmada: analysis.venta_confirmada || false,
                                lead_caliente: analysis.lead_caliente || false,
                                cotizacion_enviada: analysis.cotizacion_enviada || false,
                                metodo_pago_enviado: analysis.metodo_pago_enviado || false,
                                objeciones_superadas: analysis.objeciones_superadas || false,
                                seguimiento_efectivo: analysis.seguimiento_efectivo || false,
                                urgencia_creada: analysis.urgencia_creada || false,
                                valor_agregado: analysis.valor_agregado || false,

                                // Scores
                                score: analysis.score || 0,
                                percentage: analysis.percentage || 0,
                                score_ventas: analysis.score_ventas || 0,
                                percentage_ventas: analysis.percentage_ventas || 0,

                                // Metadata
                                generated_by: 'AI',
                                manually_edited: false,
                                ai_feedback: analysis.ai_feedback || {},

                                // Análisis cualitativo
                                resultado_comercial: analysis.resultado_comercial || {},
                                exitos_asesor: analysis.exitos_asesor || [],
                                errores_criticos: analysis.errores_criticos || [],
                                siguiente_accion: analysis.siguiente_accion || '',
                                confidence_score: analysis.confidence_score || 0.7,
                                analysis_method: 'ai',
                                analysis_version: 'v2.0',

                                evaluation_date: new Date().toISOString()
                            });
                        }
                    } catch (chatError) {
                        console.error(`   ❌ Error analizando chat ${chat.contact_name}:`, chatError);
                    }
                }

                console.log(`   ✅ Evaluaciones creadas: ${evaluations.length}`);

                if (evaluations.length === 0) {
                    botResult.status = 'skipped';
                    botResult.reason = 'No se pudieron crear evaluaciones';
                    results.skipped++;
                    results.details.push(botResult);
                    continue;
                }

                // 6. Calcular estadísticas agregadas
                const stats = calculateStats(evaluations);

                // 7. Crear análisis en BD
                const { data: analysis, error: analysisError } = await supabase
                    .from('performance_analyses')
                    .insert({
                        bot_id: bot.id,
                        analysis_name: `Análisis Automático - ${today}`,
                        analysis_date: new Date().toISOString(),
                        period_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        period_end: new Date().toISOString(),
                        status: 'finalized',
                        finalized_at: new Date().toISOString(),

                        // Estadísticas de rendimiento
                        total_conversations_analyzed: evaluations.length,
                        average_score: stats.average_score,
                        average_percentage: stats.average_percentage,
                        tiempo_contacto_count: stats.tiempo_contacto_count,
                        tiempo_respuesta_count: stats.tiempo_respuesta_count,
                        tiempo_cotizacion_count: stats.tiempo_cotizacion_count,
                        cierre_intencion_count: stats.cierre_intencion_count,
                        ofrecio_scalapay_count: stats.ofrecio_scalapay_count,
                        mas_dos_opciones_count: stats.mas_dos_opciones_count,
                        seguimiento_intencion_count: stats.seguimiento_intencion_count,

                        // Estadísticas de ventas
                        ventas_confirmadas_count: stats.ventas_confirmadas_count,
                        leads_calientes_count: stats.leads_calientes_count,
                        valor_total_ventas: stats.valor_total_ventas,
                        tasa_conversion: stats.tasa_conversion,
                        average_score_ventas: stats.average_score_ventas,
                        nivel_comercial: stats.nivel_comercial,
                        sales_summary: stats.sales_summary
                    })
                    .select()
                    .single();

                if (analysisError) {
                    console.error(`   ❌ Error creando análisis:`, analysisError);
                    botResult.status = 'failed';
                    botResult.error = analysisError.message;
                    results.failed++;
                    results.details.push(botResult);
                    continue;
                }

                // 8. Guardar evaluaciones con analysis_id
                const evaluationsWithAnalysisId = evaluations.map(ev => ({
                    ...ev,
                    performance_analysis_id: analysis.id
                }));

                const { error: evalError } = await supabase
                    .from('conversation_evaluations')
                    .insert(evaluationsWithAnalysisId);

                if (evalError) {
                    console.error(`   ❌ Error guardando evaluaciones:`, evalError);
                    botResult.status = 'failed';
                    botResult.error = evalError.message;
                    results.failed++;
                    results.details.push(botResult);
                    continue;
                }

                // 9. Crear reporte diario en daily_sales_reports
                const { error: reportError } = await supabase
                    .from('daily_sales_reports')
                    .insert({
                        asesor_id: bot.id,
                        report_date: today,

                        ventas_confirmadas: stats.ventas_confirmadas_count,
                        leads_calientes: stats.leads_calientes_count,
                        cotizaciones_enviadas: stats.cotizaciones_count,
                        conversaciones_analizadas: evaluations.length,
                        valor_total_ventas: stats.valor_total_ventas,

                        tasa_conversion: stats.tasa_conversion,
                        valor_promedio_venta: stats.valor_promedio_venta,
                        score_promedio_ventas: stats.average_score_ventas,

                        nivel_rendimiento: stats.nivel_comercial,
                        requiere_seguimiento: stats.average_percentage < 60,

                        ventas_exitosas: stats.ventas_exitosas,
                        oportunidades_perdidas: stats.oportunidades_perdidas,
                        recomendaciones: stats.recomendaciones,

                        performance_analysis_id: analysis.id
                    });

                if (reportError && reportError.code !== '23505') { // Ignorar duplicados
                    console.error(`   ⚠️ Error creando reporte diario:`, reportError);
                }

                console.log(`   ✅ Análisis completado exitosamente`);
                botResult.status = 'success';
                botResult.analysisId = analysis.id;
                botResult.conversationsAnalyzed = evaluations.length;
                botResult.averageScore = stats.average_percentage;
                results.analyzed++;
                results.details.push(botResult);

            } catch (botError) {
                console.error(`❌ Error procesando bot ${bot.session_name}:`, botError);
                results.failed++;
                results.details.push({
                    botId: bot.id,
                    botName: bot.session_name,
                    status: 'failed',
                    error: botError.message
                });
            }
        }

        console.log(`\n🎉 Análisis automático completado:`);
        console.log(`   - Total asesores: ${results.totalAdvisors}`);
        console.log(`   - Analizados: ${results.analyzed}`);
        console.log(`   - Omitidos: ${results.skipped}`);
        console.log(`   - Fallidos: ${results.failed}`);

        return NextResponse.json({
            success: true,
            message: 'Análisis automático completado',
            results
        });

    } catch (error) {
        console.error('❌ Error en análisis automático:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Error en análisis automático',
                details: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * Analiza una conversación usando IA (OpenAI)
 */
async function analyzeConversationWithAI(messages, chat) {
    try {
        // Preparar transcripción
        const transcript = messages
            .map(m => {
                const sender = m.from_me ? 'Asesor' : 'Cliente';
                const content = m.body || '[Multimedia]';
                const time = new Date(m.timestamp).toLocaleTimeString();
                return `[${time}] ${sender}: ${content}`;
            })
            .join('\n');

        // Llamar a OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'system',
                    content: `Eres un experto en análisis de ventas. Analiza esta conversación de WhatsApp y evalúa:

MÉTRICAS DE RENDIMIENTO (7 parámetros):
1. tiempo_contacto: ¿El asesor contactó al cliente en menos de 5 minutos?
2. tiempo_respuesta: ¿Las respuestas fueron rápidas (< 2 min)?
3. tiempo_cotizacion: ¿La cotización se envió en menos de 10 minutos?
4. cierre_intencion: ¿El cierre mostró intención de compra del cliente?
5. ofrecio_scalapay: ¿Se ofreció Scalapay como opción de pago?
6. mas_dos_opciones: ¿Se presentaron más de 2 opciones de viaje?
7. seguimiento_intencion: ¿Hubo seguimiento de la intención del cliente?

MÉTRICAS DE VENTAS (8 parámetros):
1. venta_confirmada: ¿Se confirmó una venta?
2. lead_caliente: ¿El cliente mostró alto interés?
3. cotizacion_enviada: ¿Se envió cotización?
4. metodo_pago_enviado: ¿Se enviaron métodos de pago?
5. objeciones_superadas: ¿Se superaron objeciones?
6. seguimiento_efectivo: ¿El seguimiento fue efectivo?
7. urgencia_creada: ¿Se creó sentido de urgencia?
8. valor_agregado: ¿Se comunicó valor agregado?

Responde SOLO con un JSON válido con esta estructura:
{
  "tiempo_contacto": boolean,
  "tiempo_respuesta": boolean,
  "tiempo_cotizacion": boolean,
  "cierre_intencion": boolean,
  "ofrecio_scalapay": boolean,
  "mas_dos_opciones": boolean,
  "seguimiento_intencion": boolean,
  "venta_confirmada": boolean,
  "lead_caliente": boolean,
  "cotizacion_enviada": boolean,
  "metodo_pago_enviado": boolean,
  "objeciones_superadas": boolean,
  "seguimiento_efectivo": boolean,
  "urgencia_creada": boolean,
  "valor_agregado": boolean,
  "exitos_asesor": ["string"],
  "errores_criticos": ["string"],
  "siguiente_accion": "string",
  "confidence_score": 0.0-1.0
}`
                }, {
                    role: 'user',
                    content: `Cliente: ${chat.contact_name}\n\nConversación:\n${transcript}`
                }],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            console.error('Error en OpenAI API:', await response.text());
            return null;
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parsear JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No se pudo extraer JSON de la respuesta');
            return null;
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Calcular scores
        const performanceScore = [
            analysis.tiempo_contacto,
            analysis.tiempo_respuesta,
            analysis.tiempo_cotizacion,
            analysis.cierre_intencion,
            analysis.ofrecio_scalapay,
            analysis.mas_dos_opciones,
            analysis.seguimiento_intencion
        ].filter(Boolean).length;

        const salesScore = [
            analysis.venta_confirmada,
            analysis.lead_caliente,
            analysis.cotizacion_enviada,
            analysis.metodo_pago_enviado,
            analysis.objeciones_superadas,
            analysis.seguimiento_efectivo,
            analysis.urgencia_creada,
            analysis.valor_agregado
        ].filter(Boolean).length;

        return {
            ...analysis,
            score: performanceScore,
            percentage: (performanceScore / 7) * 100,
            score_ventas: salesScore,
            percentage_ventas: (salesScore / 8) * 100,
            ai_feedback: {
                model: 'gpt-4o-mini',
                analyzed_at: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Error en análisis IA:', error);
        return null;
    }
}

/**
 * Calcula estadísticas agregadas de las evaluaciones
 */
function calculateStats(evaluations) {
    const total = evaluations.length;

    if (total === 0) {
        return {
            average_score: 0,
            average_percentage: 0,
            average_score_ventas: 0,
            tiempo_contacto_count: 0,
            tiempo_respuesta_count: 0,
            tiempo_cotizacion_count: 0,
            cierre_intencion_count: 0,
            ofrecio_scalapay_count: 0,
            mas_dos_opciones_count: 0,
            seguimiento_intencion_count: 0,
            ventas_confirmadas_count: 0,
            leads_calientes_count: 0,
            cotizaciones_count: 0,
            valor_total_ventas: 0,
            tasa_conversion: 0,
            valor_promedio_venta: 0,
            nivel_comercial: 'REGULAR',
            sales_summary: {},
            ventas_exitosas: [],
            oportunidades_perdidas: [],
            recomendaciones: []
        };
    }

    const totals = evaluations.reduce((acc, ev) => ({
        score: acc.score + (ev.score || 0),
        percentage: acc.percentage + (ev.percentage || 0),
        score_ventas: acc.score_ventas + (ev.score_ventas || 0),
        tiempo_contacto: acc.tiempo_contacto + (ev.tiempo_contacto ? 1 : 0),
        tiempo_respuesta: acc.tiempo_respuesta + (ev.tiempo_respuesta ? 1 : 0),
        tiempo_cotizacion: acc.tiempo_cotizacion + (ev.tiempo_cotizacion ? 1 : 0),
        cierre_intencion: acc.cierre_intencion + (ev.cierre_intencion ? 1 : 0),
        ofrecio_scalapay: acc.ofrecio_scalapay + (ev.ofrecio_scalapay ? 1 : 0),
        mas_dos_opciones: acc.mas_dos_opciones + (ev.mas_dos_opciones ? 1 : 0),
        seguimiento_intencion: acc.seguimiento_intencion + (ev.seguimiento_intencion ? 1 : 0),
        ventas_confirmadas: acc.ventas_confirmadas + (ev.venta_confirmada ? 1 : 0),
        leads_calientes: acc.leads_calientes + (ev.lead_caliente ? 1 : 0),
        cotizaciones: acc.cotizaciones + (ev.cotizacion_enviada ? 1 : 0)
    }), {
        score: 0,
        percentage: 0,
        score_ventas: 0,
        tiempo_contacto: 0,
        tiempo_respuesta: 0,
        tiempo_cotizacion: 0,
        cierre_intencion: 0,
        ofrecio_scalapay: 0,
        mas_dos_opciones: 0,
        seguimiento_intencion: 0,
        ventas_confirmadas: 0,
        leads_calientes: 0,
        cotizaciones: 0
    });

    const avgPercentage = totals.percentage / total;
    const avgScoreVentas = totals.score_ventas / total;
    const tasaConversion = total > 0 ? (totals.ventas_confirmadas / total) * 100 : 0;

    // Determinar nivel comercial
    let nivelComercial = 'REGULAR';
    if (avgPercentage >= 80) nivelComercial = 'EXCELENTE';
    else if (avgPercentage >= 70) nivelComercial = 'BUENO';
    else if (avgPercentage < 50) nivelComercial = 'DEFICIENTE';

    return {
        average_score: (totals.score / total).toFixed(2),
        average_percentage: avgPercentage.toFixed(2),
        average_score_ventas: avgScoreVentas.toFixed(2),
        tiempo_contacto_count: totals.tiempo_contacto,
        tiempo_respuesta_count: totals.tiempo_respuesta,
        tiempo_cotizacion_count: totals.tiempo_cotizacion,
        cierre_intencion_count: totals.cierre_intencion,
        ofrecio_scalapay_count: totals.ofrecio_scalapay,
        mas_dos_opciones_count: totals.mas_dos_opciones,
        seguimiento_intencion_count: totals.seguimiento_intencion,
        ventas_confirmadas_count: totals.ventas_confirmadas,
        leads_calientes_count: totals.leads_calientes,
        cotizaciones_count: totals.cotizaciones,
        valor_total_ventas: 0, // Se puede calcular si hay campo valor_venta
        tasa_conversion: tasaConversion.toFixed(2),
        valor_promedio_venta: 0,
        nivel_comercial: nivelComercial,
        sales_summary: {
            total_conversaciones: total,
            ventas: totals.ventas_confirmadas,
            leads: totals.leads_calientes,
            cotizaciones: totals.cotizaciones,
            conversion: tasaConversion.toFixed(2)
        },
        ventas_exitosas: [],
        oportunidades_perdidas: [],
        recomendaciones: []
    };
}
