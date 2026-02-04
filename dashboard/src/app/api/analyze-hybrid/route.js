import { NextResponse } from 'next/server';
import { analyzeCompletePerformance } from '@/lib/salesRendimiento';

export async function POST(request) {
  try {
    const { conversations, options = {} } = await request.json();

    if (!conversations || !Array.isArray(conversations) || conversations.length === 0) {
      return NextResponse.json({
        error: 'Se requieren conversaciones para el análisis'
      }, { status: 400 });
    }

    const results = {
      success: true,
      total_processed: 0,
      evaluations: {},
      sales_summary: {
        ventas_confirmadas: 0,
        leads_calientes: 0,
        cotizaciones_enviadas: 0,
        valor_total: 0,
        tasa_conversion: 0,
        valor_promedio: 0
      },
      process_summary: {
        score_promedio_proceso: 0,
        parametros_criticos: []
      },
      combined_summary: {
        score_promedio_total: 0,
        nivel_general: 'REGULAR',
        conversaciones_criticas: []
      },
      recommendations: {
        mejoras_prioritarias: [],
        acciones_inmediatas: [],
        seguimientos_requeridos: []
      }
    };

    // Procesar cada conversación
    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];

      try {
        // Obtener mensajes de la conversación
        const messagesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/get-messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: conversation.id,
            limit: options.message_limit || 30
          })
        });

        if (!messagesResponse.ok) {
          console.warn(`No se pudieron obtener mensajes para conversación ${conversation.id}`);
          continue;
        }

        const { messages } = await messagesResponse.json();

        if (!messages || messages.length === 0) {
          console.warn(`Conversación ${conversation.id} sin mensajes`);
          continue;
        }

        // Realizar análisis híbrido completo
        const analysis = await analyzeCompletePerformance(messages, {
          chat_id: conversation.id,
          contact_name: conversation.contact_name || conversation.name || 'Cliente',
          contact_number: conversation.contact_number || conversation.chat_id
        });

        if (analysis.success && analysis.evaluation) {
          const evaluation = analysis.evaluation;
          results.evaluations[conversation.id] = evaluation;
          results.total_processed++;

          // Acumular estadísticas de ventas
          if (evaluation.venta_confirmada) {
            results.sales_summary.ventas_confirmadas++;
          }

          if (evaluation.lead_caliente) {
            results.sales_summary.leads_calientes++;
          }

          if (evaluation.cotizacion_enviada) {
            results.sales_summary.cotizaciones_enviadas++;
          }

          if (evaluation.valor_venta && evaluation.valor_venta > 0) {
            results.sales_summary.valor_total += evaluation.valor_venta;
          }

          // Identificar conversaciones críticas
          const scoreTotal = parseFloat(evaluation.percentage_total || 0);
          if (scoreTotal < 40) {
            results.combined_summary.conversaciones_criticas.push({
              chat_id: conversation.id,
              contact_name: evaluation.contact_name,
              score: scoreTotal,
              resultado: evaluation.resultado_comercial?.tipo || 'SIN_CLASIFICAR',
              area_critica: analysis.analysis_summary?.area_critica || 'GENERAL'
            });
          }

          // Agregar recomendaciones
          if (analysis.recommendations) {
            if (analysis.recommendations.principales) {
              results.recommendations.mejoras_prioritarias.push(
                ...analysis.recommendations.principales.slice(0, 2)
              );
            }

            if (analysis.recommendations.siguiente_accion) {
              results.recommendations.acciones_inmediatas.push({
                chat_id: conversation.id,
                contact_name: evaluation.contact_name,
                accion: analysis.recommendations.siguiente_accion
              });
            }

            if (evaluation.resultado_comercial?.prioridad === 'ALTA' ||
                evaluation.resultado_comercial?.prioridad === 'MEDIA') {
              results.recommendations.seguimientos_requeridos.push({
                chat_id: conversation.id,
                contact_name: evaluation.contact_name,
                tipo: evaluation.resultado_comercial.tipo,
                prioridad: evaluation.resultado_comercial.prioridad,
                valor: evaluation.resultado_comercial.valor || 0
              });
            }
          }

        } else {
          console.error(`Error en análisis de conversación ${conversation.id}:`, analysis.error);
        }

      } catch (conversationError) {
        console.error(`Error procesando conversación ${conversation.id}:`, conversationError);
        continue;
      }
    }

    // Calcular estadísticas finales
    if (results.total_processed > 0) {
      // Estadísticas de ventas
      results.sales_summary.tasa_conversion =
        ((results.sales_summary.ventas_confirmadas / results.total_processed) * 100).toFixed(1);

      results.sales_summary.valor_promedio =
        results.sales_summary.ventas_confirmadas > 0
          ? (results.sales_summary.valor_total / results.sales_summary.ventas_confirmadas).toFixed(0)
          : 0;

      // Score promedio total
      const totalScores = Object.values(results.evaluations)
        .reduce((sum, eval) => sum + parseFloat(eval.percentage_total || 0), 0);

      results.combined_summary.score_promedio_total =
        (totalScores / results.total_processed).toFixed(1);

      // Score promedio de proceso
      const processScores = Object.values(results.evaluations)
        .reduce((sum, eval) => sum + parseFloat(eval.percentage_proceso || 0), 0);

      results.process_summary.score_promedio_proceso =
        (processScores / results.total_processed).toFixed(1);

      // Determinar nivel general
      const avgScore = parseFloat(results.combined_summary.score_promedio_total);
      if (avgScore >= 80) {
        results.combined_summary.nivel_general = 'EXCELENTE';
      } else if (avgScore >= 70) {
        results.combined_summary.nivel_general = 'BUENO';
      } else if (avgScore >= 60) {
        results.combined_summary.nivel_general = 'REGULAR';
      } else {
        results.combined_summary.nivel_general = 'DEFICIENTE';
      }

      // Identificar parámetros críticos más comunes
      const parametrosFallos = {};
      Object.values(results.evaluations).forEach(eval => {
        if (!eval.venta_confirmada) parametrosFallos.venta_confirmada = (parametrosFallos.venta_confirmada || 0) + 1;
        if (!eval.lead_caliente) parametrosFallos.lead_caliente = (parametrosFallos.lead_caliente || 0) + 1;
        if (!eval.cotizacion_enviada) parametrosFallos.cotizacion_enviada = (parametrosFallos.cotizacion_enviada || 0) + 1;
        if (!eval.seguimiento_efectivo) parametrosFallos.seguimiento_efectivo = (parametrosFallos.seguimiento_efectivo || 0) + 1;
      });

      results.process_summary.parametros_criticos = Object.entries(parametrosFallos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([param, count]) => ({
          parametro: param,
          fallos: count,
          porcentaje: ((count / results.total_processed) * 100).toFixed(1)
        }));

      // Limpiar recomendaciones duplicadas
      results.recommendations.mejoras_prioritarias =
        [...new Set(results.recommendations.mejoras_prioritarias)].slice(0, 5);
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error en análisis híbrido:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno en análisis híbrido',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para obtener configuración de análisis
export async function GET() {
  return NextResponse.json({
    available_parameters: {
      sales_parameters: [
        'venta_confirmada',
        'lead_caliente',
        'cotizacion_enviada',
        'metodo_pago_enviado',
        'objeciones_superadas',
        'seguimiento_efectivo',
        'urgencia_creada',
        'valor_agregado'
      ],
      process_parameters: [
        'tiempo_contacto',
        'tiempo_respuesta',
        'tiempo_cotizacion',
        'cierre_intencion',
        'ofrecio_scalapay',
        'mas_dos_opciones',
        'seguimiento_intencion'
      ]
    },
    scoring_weights: {
      sales_weight: 0.7,
      process_weight: 0.3
    },
    classification_levels: {
      excelente: '>= 80%',
      bueno: '70-79%',
      regular: '60-69%',
      deficiente: '< 60%'
    }
  });
}
