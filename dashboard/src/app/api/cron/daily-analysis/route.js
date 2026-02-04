import { NextResponse } from 'next/server';
import { performDailySalesAnalysis, getCronStatus } from '@/lib/cronJobs';

export async function POST(request) {
  try {
    const { force = false } = await request.json().catch(() => ({}));

    console.log('🚀 API: Iniciando análisis diario manual...');

    // Verificar si ya hay un análisis en progreso
    const status = getCronStatus();
    if (status.is_analysis_running && !force) {
      return NextResponse.json({
        success: false,
        error: 'Ya hay un análisis en progreso',
        message: 'Use force=true para forzar la ejecución'
      }, { status: 409 });
    }

    // Ejecutar análisis
    const result = await performDailySalesAnalysis();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Análisis diario completado exitosamente',
        data: result.results,
        executed_at: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Error durante el análisis diario'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Error en API de análisis diario:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Obtener estado del sistema de cron
    const status = getCronStatus();

    return NextResponse.json({
      success: true,
      status: status,
      endpoints: {
        manual_trigger: 'POST /api/cron/daily-analysis',
        status: 'GET /api/cron/daily-analysis',
        configure: 'PUT /api/cron/configure'
      },
      usage: {
        manual_execution: 'POST with { "force": true } to override running analysis',
        check_status: 'GET to see current system status'
      }
    });

  } catch (error) {
    console.error('Error obteniendo estado del cron:', error);
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo estado del sistema'
    }, { status: 500 });
  }
}
