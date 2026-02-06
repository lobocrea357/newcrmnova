import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables')
}

// Use service role key if available, otherwise use anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('analysisId')

    if (!analysisId) {
      return NextResponse.json(
        { error: 'analysisId parameter is required' },
        { status: 400 }
      )
    }

    // Get analysis details
    const { data: analysis, error: analysisError } = await supabase
      .from('performance_analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found', details: analysisError?.message },
        { status: 404 }
      )
    }

    // Get evaluations count for this analysis
    const { count: evaluationsCount, error: evaluationsError } = await supabase
      .from('conversation_evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('performance_analysis_id', analysisId)

    if (evaluationsError) {
      console.warn('Error counting evaluations:', evaluationsError)
    }

    // Get reports for this analysis
    const { data: reports, error: reportsError } = await supabase
      .from('performance_reports')
      .select('*')
      .eq('performance_analysis_id', analysisId)
      .order('created_at', { ascending: false })

    if (reportsError) {
      console.warn('Error fetching reports:', reportsError)
    }

    // Check if we have all necessary tables
    const tableChecks = []

    // Check if performance_analyses table exists and is accessible
    try {
      await supabase.from('performance_analyses').select('id').limit(1)
      tableChecks.push({ table: 'performance_analyses', status: 'accessible' })
    } catch (error) {
      tableChecks.push({ table: 'performance_analyses', status: 'error', error: error.message })
    }

    // Check if conversation_evaluations table exists and is accessible
    try {
      await supabase.from('conversation_evaluations').select('id').limit(1)
      tableChecks.push({ table: 'conversation_evaluations', status: 'accessible' })
    } catch (error) {
      tableChecks.push({ table: 'conversation_evaluations', status: 'error', error: error.message })
    }

    // Check if performance_reports table exists and is accessible
    try {
      await supabase.from('performance_reports').select('id').limit(1)
      tableChecks.push({ table: 'performance_reports', status: 'accessible' })
    } catch (error) {
      tableChecks.push({ table: 'performance_reports', status: 'error', error: error.message })
    }

    const status = {
      analysis: {
        found: !!analysis,
        id: analysis?.id,
        bot_id: analysis?.bot_id,
        analysis_name: analysis?.analysis_name,
        status: analysis?.status,
        created_at: analysis?.created_at,
        total_conversations_analyzed: analysis?.total_conversations_analyzed
      },
      evaluations: {
        count: evaluationsCount || 0,
        has_evaluations: (evaluationsCount || 0) > 0
      },
      reports: {
        count: reports?.length || 0,
        has_reports: (reports?.length || 0) > 0,
        reports: reports || []
      },
      tables: tableChecks,
      diagnosis: {
        can_generate_report: !!analysis && (evaluationsCount || 0) > 0,
        missing_data: [],
        recommendations: []
      }
    }

    // Add diagnosis
    if (!analysis) {
      status.diagnosis.missing_data.push('Analysis not found')
      status.diagnosis.recommendations.push('Verify the analysis ID is correct')
    }

    if ((evaluationsCount || 0) === 0) {
      status.diagnosis.missing_data.push('No evaluations found for this analysis')
      status.diagnosis.recommendations.push('Run the analysis process to generate evaluations')
    }

    if ((reports?.length || 0) === 0) {
      status.diagnosis.missing_data.push('No reports found for this analysis')
      status.diagnosis.recommendations.push('Generate a report using the AI report generation')
    }

    const hasTableErrors = tableChecks.some(check => check.status === 'error')
    if (hasTableErrors) {
      status.diagnosis.missing_data.push('Database table access issues detected')
      status.diagnosis.recommendations.push('Check database schema and permissions')
    }

    return NextResponse.json({
      success: true,
      status
    })

  } catch (error) {
    console.error('Error in status check API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Health check for all performance tables
    const healthCheck = {
      timestamp: new Date().toISOString(),
      tables: {},
      overall_health: 'unknown'
    }

    const tablesToCheck = [
      'performance_analyses',
      'conversation_evaluations',
      'performance_reports',
      'bots',
      'chats',
      'messages'
    ]

    let healthyTables = 0

    for (const tableName of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .limit(1)

        if (error) {
          healthCheck.tables[tableName] = {
            status: 'error',
            error: error.message,
            accessible: false
          }
        } else {
          healthCheck.tables[tableName] = {
            status: 'healthy',
            accessible: true,
            record_count: count || 0
          }
          healthyTables++
        }
      } catch (error) {
        healthCheck.tables[tableName] = {
          status: 'critical_error',
          error: error.message,
          accessible: false
        }
      }
    }

    // Determine overall health
    const healthPercentage = (healthyTables / tablesToCheck.length) * 100
    if (healthPercentage === 100) {
      healthCheck.overall_health = 'healthy'
    } else if (healthPercentage >= 80) {
      healthCheck.overall_health = 'degraded'
    } else if (healthPercentage >= 50) {
      healthCheck.overall_health = 'unhealthy'
    } else {
      healthCheck.overall_health = 'critical'
    }

    healthCheck.healthy_tables = healthyTables
    healthCheck.total_tables = tablesToCheck.length
    healthCheck.health_percentage = healthPercentage

    return NextResponse.json({
      success: true,
      health: healthCheck
    })

  } catch (error) {
    console.error('Error in health check API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        details: error.message,
        health: {
          overall_health: 'critical',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}
