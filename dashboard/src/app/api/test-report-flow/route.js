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

    console.log(`🧪 Testing report flow for analysis: ${analysisId}`)

    const testResults = {
      timestamp: new Date().toISOString(),
      analysisId,
      steps: [],
      overall_success: false,
      recommendations: []
    }

    // Step 1: Check if analysis exists
    try {
      const { data: analysis, error: analysisError } = await supabase
        .from('performance_analyses')
        .select('*')
        .eq('id', analysisId)
        .single()

      if (analysisError || !analysis) {
        testResults.steps.push({
          step: 1,
          name: 'Check Analysis Exists',
          status: 'failed',
          error: analysisError?.message || 'Analysis not found',
          data: null
        })
        testResults.recommendations.push('Verify the analysis ID is correct and exists in the database')
      } else {
        testResults.steps.push({
          step: 1,
          name: 'Check Analysis Exists',
          status: 'success',
          data: {
            id: analysis.id,
            analysis_name: analysis.analysis_name,
            bot_id: analysis.bot_id,
            total_conversations: analysis.total_conversations_analyzed
          }
        })
      }
    } catch (error) {
      testResults.steps.push({
        step: 1,
        name: 'Check Analysis Exists',
        status: 'error',
        error: error.message
      })
    }

    // Step 2: Check if evaluations exist for this analysis
    try {
      const { count: evaluationsCount, error: evaluationsError } = await supabase
        .from('conversation_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('performance_analysis_id', analysisId)

      if (evaluationsError) {
        testResults.steps.push({
          step: 2,
          name: 'Check Evaluations Exist',
          status: 'failed',
          error: evaluationsError.message
        })
        testResults.recommendations.push('Check database permissions for conversation_evaluations table')
      } else if (evaluationsCount === 0) {
        testResults.steps.push({
          step: 2,
          name: 'Check Evaluations Exist',
          status: 'warning',
          message: 'No evaluations found for this analysis',
          data: { count: evaluationsCount }
        })
        testResults.recommendations.push('Run the analysis process to generate evaluations before creating reports')
      } else {
        testResults.steps.push({
          step: 2,
          name: 'Check Evaluations Exist',
          status: 'success',
          data: { count: evaluationsCount }
        })
      }
    } catch (error) {
      testResults.steps.push({
        step: 2,
        name: 'Check Evaluations Exist',
        status: 'error',
        error: error.message
      })
    }

    // Step 3: Check if reports already exist
    try {
      const { data: reports, error: reportsError } = await supabase
        .from('performance_reports')
        .select('*')
        .eq('performance_analysis_id', analysisId)

      if (reportsError) {
        testResults.steps.push({
          step: 3,
          name: 'Check Existing Reports',
          status: 'failed',
          error: reportsError.message
        })
        testResults.recommendations.push('Check database permissions for performance_reports table')
      } else {
        testResults.steps.push({
          step: 3,
          name: 'Check Existing Reports',
          status: 'success',
          data: {
            count: reports?.length || 0,
            reports: reports?.map(r => ({
              id: r.id,
              report_type: r.report_type,
              created_at: r.created_at,
              has_data: !!r.report_data
            })) || []
          }
        })
      }
    } catch (error) {
      testResults.steps.push({
        step: 3,
        name: 'Check Existing Reports',
        status: 'error',
        error: error.message
      })
    }

    // Step 4: Test API endpoints
    const apiTests = [
      { name: 'Get Evaluations API', endpoint: `/api/rendimiento/save-evaluations?analysisId=${analysisId}` },
      { name: 'Create Report API', endpoint: '/api/rendimiento/create-report' },
      { name: 'Status Check API', endpoint: `/api/rendimiento/status?analysisId=${analysisId}` }
    ]

    for (const apiTest of apiTests) {
      try {
        const response = await fetch(`${request.nextUrl.origin}${apiTest.endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          testResults.steps.push({
            step: 4,
            name: `Test ${apiTest.name}`,
            status: 'success',
            data: { endpoint: apiTest.endpoint, status: response.status }
          })
        } else {
          const errorData = await response.json().catch(() => ({}))
          testResults.steps.push({
            step: 4,
            name: `Test ${apiTest.name}`,
            status: 'warning',
            message: `API returned ${response.status}`,
            data: { endpoint: apiTest.endpoint, status: response.status, error: errorData }
          })
        }
      } catch (error) {
        testResults.steps.push({
          step: 4,
          name: `Test ${apiTest.name}`,
          status: 'error',
          error: error.message,
          data: { endpoint: apiTest.endpoint }
        })
      }
    }

    // Step 5: Check environment variables
    const envChecks = [
      { name: 'SUPABASE_URL', value: !!supabaseUrl },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', value: !!supabaseServiceKey },
      { name: 'SUPABASE_ANON_KEY', value: !!supabaseAnonKey },
      { name: 'OPENAI_API_KEY', value: !!process.env.OPENAI_API_KEY }
    ]

    testResults.steps.push({
      step: 5,
      name: 'Check Environment Variables',
      status: envChecks.every(check => check.value) ? 'success' : 'warning',
      data: envChecks
    })

    if (!process.env.OPENAI_API_KEY) {
      testResults.recommendations.push('Set OPENAI_API_KEY environment variable for AI report generation')
    }

    // Determine overall success
    const failedSteps = testResults.steps.filter(step => step.status === 'failed' || step.status === 'error')
    testResults.overall_success = failedSteps.length === 0

    if (!testResults.overall_success) {
      testResults.recommendations.push('Fix the failed steps before attempting to generate reports')
    } else {
      testResults.recommendations.push('All checks passed! Report generation should work correctly')
    }

    console.log(`🧪 Test completed. Overall success: ${testResults.overall_success}`)

    return NextResponse.json({
      success: true,
      test_results: testResults
    })

  } catch (error) {
    console.error('Error in test flow:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Test flow failed',
        details: error.message,
        test_results: {
          timestamp: new Date().toISOString(),
          overall_success: false,
          steps: [{
            step: 0,
            name: 'Initialize Test',
            status: 'error',
            error: error.message
          }]
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Full end-to-end test with sample data
    const { analysisId, generateSampleData = false } = await request.json()

    if (!analysisId) {
      return NextResponse.json(
        { error: 'analysisId is required in request body' },
        { status: 400 }
      )
    }

    console.log(`🧪 Running full end-to-end test for analysis: ${analysisId}`)

    const testResults = {
      timestamp: new Date().toISOString(),
      analysisId,
      generateSampleData,
      steps: [],
      overall_success: false
    }

    // If generateSampleData is true, create sample evaluations
    if (generateSampleData) {
      try {
        const sampleEvaluations = [
          {
            conversation_id: `test-conv-${Date.now()}-1`,
            performance_analysis_id: analysisId,
            score: 5,
            percentage: 71.4,
            tiempo_contacto: true,
            tiempo_respuesta: false,
            tiempo_cotizacion: true,
            cierre_intencion: true,
            ofrecio_scalapay: false,
            mas_dos_opciones: true,
            seguimiento_intencion: true
          },
          {
            conversation_id: `test-conv-${Date.now()}-2`,
            performance_analysis_id: analysisId,
            score: 3,
            percentage: 42.9,
            tiempo_contacto: false,
            tiempo_respuesta: true,
            tiempo_cotizacion: false,
            cierre_intencion: true,
            ofrecio_scalapay: false,
            mas_dos_opciones: false,
            seguimiento_intencion: true
          }
        ]

        const { data: createdEvaluations, error: createError } = await supabase
          .from('conversation_evaluations')
          .insert(sampleEvaluations)
          .select()

        if (createError) {
          testResults.steps.push({
            step: 1,
            name: 'Create Sample Evaluations',
            status: 'failed',
            error: createError.message
          })
        } else {
          testResults.steps.push({
            step: 1,
            name: 'Create Sample Evaluations',
            status: 'success',
            data: { created_count: createdEvaluations?.length || 0 }
          })
        }
      } catch (error) {
        testResults.steps.push({
          step: 1,
          name: 'Create Sample Evaluations',
          status: 'error',
          error: error.message
        })
      }
    }

    // Test the complete report generation flow
    try {
      // Step 2: Get evaluations
      const getEvaluationsResponse = await fetch(`${request.nextUrl.origin}/api/rendimiento/save-evaluations?analysisId=${analysisId}`, {
        method: 'GET'
      })

      if (!getEvaluationsResponse.ok) {
        const errorData = await getEvaluationsResponse.json()
        testResults.steps.push({
          step: 2,
          name: 'Get Evaluations via API',
          status: 'failed',
          error: errorData.error || 'Failed to get evaluations'
        })
      } else {
        const evaluationsResult = await getEvaluationsResponse.json()
        testResults.steps.push({
          step: 2,
          name: 'Get Evaluations via API',
          status: 'success',
          data: { count: evaluationsResult.count || 0 }
        })

        // Step 3: Create a test report
        const sampleReportData = {
          performance_analysis_id: analysisId,
          report_data: {
            summary: 'Test report generated by automated flow',
            timestamp: new Date().toISOString(),
            total_evaluations: evaluationsResult.count || 0
          },
          report_type: 'test',
          report_name: `Test Report ${new Date().toISOString()}`
        }

        const createReportResponse = await fetch(`${request.nextUrl.origin}/api/rendimiento/create-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reportData: sampleReportData })
        })

        if (!createReportResponse.ok) {
          const errorData = await createReportResponse.json()
          testResults.steps.push({
            step: 3,
            name: 'Create Test Report',
            status: 'failed',
            error: errorData.error || 'Failed to create report'
          })
        } else {
          const reportResult = await createReportResponse.json()
          testResults.steps.push({
            step: 3,
            name: 'Create Test Report',
            status: 'success',
            data: { report_id: reportResult.data?.id }
          })
        }
      }
    } catch (error) {
      testResults.steps.push({
        step: 2,
        name: 'Full Flow Test',
        status: 'error',
        error: error.message
      })
    }

    // Determine overall success
    const failedSteps = testResults.steps.filter(step => step.status === 'failed' || step.status === 'error')
    testResults.overall_success = failedSteps.length === 0

    return NextResponse.json({
      success: true,
      test_results: testResults
    })

  } catch (error) {
    console.error('Error in full test flow:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Full test flow failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}
