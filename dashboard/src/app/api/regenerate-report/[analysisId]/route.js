import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePerformanceReport } from '@/lib/aiPerformance';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * API para regenerar reporte de rendimiento
 * Útil cuando se editan evaluaciones manualmente
 */
export async function POST(request, { params }) {
  try {
    const analysisId = params.analysisId;

    console.log(`🔄 Regenerando reporte para análisis: ${analysisId}`);

    // 1. Obtener análisis
    const { data: analysis, error: analysisError } = await supabase
      .from('performance_analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Análisis no encontrado' },
        { status: 404 }
      );
    }

    // 2. Obtener evaluaciones actualizadas
    const { data: evaluations, error: evalsError } = await supabase
      .from('conversation_evaluations')
      .select('*')
      .eq('performance_analysis_id', analysisId);

    if (evalsError) {
      throw evalsError;
    }

    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json(
        { error: 'No hay evaluaciones para este análisis' },
        { status: 400 }
      );
    }

    console.log(`📊 Regenerando reporte con ${evaluations.length} evaluaciones`);

    // 3. Generar nuevo reporte con IA
    const reportData = await generatePerformanceReport(evaluations);

    // 4. Buscar reporte existente
    const { data: existingReport } = await supabase
      .from('performance_reports')
      .select('id')
      .eq('performance_analysis_id', analysisId)
      .single();

    let savedReport;

    if (existingReport) {
      // Actualizar reporte existente
      const { data: updatedReport, error: updateError } = await supabase
        .from('performance_reports')
        .update({
          report_data: reportData.report,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReport.id)
        .select()
        .single();

      if (updateError) throw updateError;
      savedReport = updatedReport;
      console.log('✅ Reporte actualizado');
    } else {
      // Crear nuevo reporte
      const { data: newReport, error: insertError } = await supabase
        .from('performance_reports')
        .insert({
          performance_analysis_id: analysisId,
          report_data: reportData.report,
          report_type: 'manual',
          report_name: `Reporte de ${analysis.bot?.session_name || analysis.worker?.name || 'Asesor'}`,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      savedReport = newReport;
      console.log('✅ Nuevo reporte creado');
    }

    return NextResponse.json({
      success: true,
      report: savedReport,
      message: 'Reporte regenerado exitosamente',
    });
  } catch (error) {
    console.error('❌ Error regenerando reporte:', error);
    return NextResponse.json(
      { error: `Error al regenerar reporte: ${error.message}` },
      { status: 500 }
    );
  }
}
