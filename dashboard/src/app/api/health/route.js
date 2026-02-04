import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCronStatus } from '@/lib/cronJobs';

export async function GET() {
  const startTime = Date.now();

  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {},
      system: {},
      errors: []
    };

    // 1. Verificar base de datos
    try {
      const { data, error } = await supabase
        .from('sales_analysis_config')
        .select('config_key')
        .limit(1);

      if (error) throw error;

      healthStatus.services.database = {
        status: 'healthy',
        response_time: Date.now() - startTime,
        last_check: new Date().toISOString()
      };
    } catch (error) {
      healthStatus.services.database = {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date().toISOString()
      };
      healthStatus.errors.push('Database connection failed');
    }

    // 2. Verificar sistema de cron
    try {
      const cronStatus = getCronStatus();

      healthStatus.services.cron_system = {
        status: cronStatus.is_initialized ? 'healthy' : 'warning',
        is_initialized: cronStatus.is_initialized,
        is_running: cronStatus.is_running,
        is_analysis_running: cronStatus.is_analysis_running,
        last_check: new Date().toISOString()
      };

      if (!cronStatus.is_initialized) {
        healthStatus.errors.push('Cron system not initialized');
      }
    } catch (error) {
      healthStatus.services.cron_system = {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date().toISOString()
      };
      healthStatus.errors.push('Cron system check failed');
    }

    // 3. Verificar OpenAI API
    try {
      if (process.env.OPENAI_API_KEY) {
        // Solo verificar que la key esté presente, no hacer llamada real
        healthStatus.services.openai = {
          status: 'healthy',
          api_key_configured: true,
          last_check: new Date().toISOString()
        };
      } else {
        healthStatus.services.openai = {
          status: 'warning',
          api_key_configured: false,
          last_check: new Date().toISOString()
        };
        healthStatus.errors.push('OpenAI API key not configured');
      }
    } catch (error) {
      healthStatus.services.openai = {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date().toISOString()
      };
      healthStatus.errors.push('OpenAI service check failed');
    }

    // 4. Información del sistema
    healthStatus.system = {
      node_version: process.version,
      platform: process.platform,
      memory_usage: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        unit: 'MB'
      },
      uptime: Math.round(process.uptime()),
      response_time: Date.now() - startTime
    };

    // 5. Verificar análisis recientes
    try {
      const { data: recentAnalysis } = await supabase
        .from('daily_sales_reports')
        .select('report_date, ventas_confirmadas, leads_calientes')
        .order('report_date', { ascending: false })
        .limit(1);

      healthStatus.services.recent_analysis = {
        status: 'healthy',
        last_analysis_date: recentAnalysis?.[0]?.report_date || null,
        last_analysis_sales: recentAnalysis?.[0]?.ventas_confirmadas || 0,
        last_analysis_leads: recentAnalysis?.[0]?.leads_calientes || 0,
        last_check: new Date().toISOString()
      };
    } catch (error) {
      healthStatus.services.recent_analysis = {
        status: 'warning',
        error: 'Could not fetch recent analysis',
        last_check: new Date().toISOString()
      };
    }

    // 6. Determinar estado general
    const hasUnhealthyServices = Object.values(healthStatus.services)
      .some(service => service.status === 'unhealthy');

    const hasWarnings = Object.values(healthStatus.services)
      .some(service => service.status === 'warning');

    if (hasUnhealthyServices) {
      healthStatus.status = 'unhealthy';
    } else if (hasWarnings) {
      healthStatus.status = 'degraded';
    }

    // 7. Información adicional para monitoreo
    healthStatus.meta = {
      version: '2.0.0',
      build_time: process.env.BUILD_TIME || 'unknown',
      commit: process.env.GIT_COMMIT || 'unknown',
      features: {
        cron_analysis: true,
        ai_detection: true,
        pdf_generation: true,
        admin_panel: true
      }
    };

    // Respuesta con código HTTP apropiado
    const statusCode = healthStatus.status === 'healthy' ? 200 :
                      healthStatus.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      error: 'Health check system failure',
      details: error.message,
      system: {
        node_version: process.version,
        platform: process.platform,
        response_time: Date.now() - startTime
      }
    }, { status: 503 });
  }
}

// Endpoint simplificado para verificaciones rápidas
export async function HEAD() {
  try {
    // Verificación básica super rápida
    const { error } = await supabase
      .from('sales_analysis_config')
      .select('config_key')
      .limit(1);

    if (error) throw error;

    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
}
