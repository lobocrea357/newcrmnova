import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { initializeDailySalesAnalysis, stopDailySalesAnalysis, getCronStatus } from '@/lib/cronJobs';

export async function GET() {
  try {
    // Obtener configuración actual
    const { data: config, error } = await supabase
      .from('sales_analysis_config')
      .select('*')
      .order('config_key');

    if (error) throw error;

    const status = getCronStatus();

    return NextResponse.json({
      success: true,
      configuration: config,
      system_status: status,
      available_timezones: [
        'America/Bogota',
        'America/Mexico_City',
        'America/New_York',
        'Europe/Madrid',
        'UTC'
      ],
      cron_patterns: {
        'daily_midnight': '0 0 * * *',
        'daily_6am': '0 6 * * *',
        'daily_noon': '0 12 * * *',
        'weekdays_only': '0 0 * * 1-5',
        'custom': 'Custom cron expression'
      }
    });

  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo configuración'
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const updates = await request.json();

    // Validar updates
    const validConfigKeys = [
      'cron_settings',
      'parameters_weights',
      'analysis_thresholds',
      'notification_settings'
    ];

    const results = [];

    for (const [key, value] of Object.entries(updates)) {
      if (!validConfigKeys.includes(key)) {
        return NextResponse.json({
          success: false,
          error: `Clave de configuración inválida: ${key}`,
          valid_keys: validConfigKeys
        }, { status: 400 });
      }

      // Validaciones específicas
      if (key === 'cron_settings') {
        const required = ['daily_analysis_time', 'timezone', 'enabled'];
        const missing = required.filter(field => !(field in value));
        if (missing.length > 0) {
          return NextResponse.json({
            success: false,
            error: `Campos requeridos faltantes en cron_settings: ${missing.join(', ')}`
          }, { status: 400 });
        }

        // Validar formato de hora
        const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timePattern.test(value.daily_analysis_time)) {
          return NextResponse.json({
            success: false,
            error: 'Formato de hora inválido. Use HH:MM (24h)'
          }, { status: 400 });
        }
      }

      if (key === 'parameters_weights') {
        const requiredParams = [
          'venta_confirmada',
          'lead_caliente',
          'cotizacion_enviada',
          'metodo_pago_enviado',
          'objeciones_superadas',
          'seguimiento_efectivo',
          'urgencia_creada',
          'valor_agregado'
        ];

        const missingParams = requiredParams.filter(param => !(param in value));
        if (missingParams.length > 0) {
          return NextResponse.json({
            success: false,
            error: `Parámetros faltantes en weights: ${missingParams.join(', ')}`
          }, { status: 400 });
        }

        // Validar que todos los pesos sean números positivos
        for (const [param, weight] of Object.entries(value)) {
          if (typeof weight !== 'number' || weight <= 0) {
            return NextResponse.json({
              success: false,
              error: `Peso inválido para ${param}: debe ser un número positivo`
            }, { status: 400 });
          }
        }
      }

      if (key === 'analysis_thresholds') {
        const requiredThresholds = ['excelente_threshold', 'bueno_threshold', 'regular_threshold'];
        const missing = requiredThresholds.filter(field => !(field in value));
        if (missing.length > 0) {
          return NextResponse.json({
            success: false,
            error: `Umbrales requeridos faltantes: ${missing.join(', ')}`
          }, { status: 400 });
        }

        // Validar orden de umbrales
        if (value.excelente_threshold <= value.bueno_threshold ||
            value.bueno_threshold <= value.regular_threshold ||
            value.regular_threshold <= 0) {
          return NextResponse.json({
            success: false,
            error: 'Umbrales inválidos. Deben cumplir: excelente > bueno > regular > 0'
          }, { status: 400 });
        }
      }

      // Actualizar configuración en la base de datos
      const { data, error } = await supabase
        .from('sales_analysis_config')
        .update({
          config_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', key)
        .select()
        .single();

      if (error) throw error;

      results.push({
        config_key: key,
        updated: true,
        new_value: data.config_value
      });
    }

    // Si se actualizó cron_settings, reiniciar el sistema de cron
    if ('cron_settings' in updates) {
      try {
        console.log('🔄 Reiniciando sistema de cron con nueva configuración...');
        stopDailySalesAnalysis();

        if (updates.cron_settings.enabled) {
          initializeDailySalesAnalysis();
          console.log('✅ Sistema de cron reiniciado');
        } else {
          console.log('📴 Sistema de cron deshabilitado');
        }
      } catch (cronError) {
        console.error('Error reiniciando cron:', cronError);
        return NextResponse.json({
          success: false,
          error: 'Configuración actualizada pero error reiniciando cron',
          details: cronError.message,
          results
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      updated_configs: results,
      system_restarted: 'cron_settings' in updates
    });

  } catch (error) {
    console.error('Error actualizando configuración:', error);
    return NextResponse.json({
      success: false,
      error: 'Error actualizando configuración',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        initializeDailySalesAnalysis();
        return NextResponse.json({
          success: true,
          message: 'Sistema de cron iniciado',
          status: getCronStatus()
        });

      case 'stop':
        stopDailySalesAnalysis();
        return NextResponse.json({
          success: true,
          message: 'Sistema de cron detenido',
          status: getCronStatus()
        });

      case 'restart':
        stopDailySalesAnalysis();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        initializeDailySalesAnalysis();
        return NextResponse.json({
          success: true,
          message: 'Sistema de cron reiniciado',
          status: getCronStatus()
        });

      case 'test_config':
        // Validar configuración actual
        const { data: cronConfig } = await supabase
          .from('sales_analysis_config')
          .select('config_value')
          .eq('config_key', 'cron_settings')
          .single();

        if (!cronConfig?.config_value?.enabled) {
          return NextResponse.json({
            success: false,
            error: 'Sistema de cron deshabilitado en configuración'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Configuración válida',
          config: cronConfig.config_value,
          next_execution: 'Calculado según cron_time configurado'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida',
          available_actions: ['start', 'stop', 'restart', 'test_config']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error en acción de cron:', error);
    return NextResponse.json({
      success: false,
      error: 'Error ejecutando acción',
      details: error.message
    }, { status: 500 });
  }
}
