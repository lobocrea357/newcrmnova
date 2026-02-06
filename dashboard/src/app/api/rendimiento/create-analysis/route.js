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

export async function POST(request) {
  try {
    const { analysisData, evaluations } = await request.json()

    console.log('📥 Received request:')
    console.log('   - analysisData:', !!analysisData)
    console.log('   - evaluations:', Array.isArray(evaluations) ? `${evaluations.length} items` : 'not provided')

    if (!analysisData) {
      return NextResponse.json(
        { error: 'analysisData is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!analysisData.bot_id) {
      return NextResponse.json(
        { error: 'bot_id is required in analysisData' },
        { status: 400 }
      )
    }

    // Create the analysis in the database
    const { data: analysis, error: analysisError } = await supabase
      .from('performance_analyses')
      .insert([{
        ...analysisData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (analysisError) {
      console.error('Error creating performance analysis:', analysisError)
      return NextResponse.json(
        { error: 'Failed to create performance analysis', details: analysisError.message },
        { status: 500 }
      )
    }

    console.log('✅ Performance analysis created successfully:', analysis?.id)

    // If evaluations are provided, insert them as well
    if (evaluations && Array.isArray(evaluations) && evaluations.length > 0) {
      console.log(`📝 Inserting ${evaluations.length} evaluations...`)

      const evaluationsWithAnalysisId = evaluations.map(evaluation => ({
        ...evaluation,
        performance_analysis_id: analysis.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data: insertedEvaluations, error: evaluationsError } = await supabase
        .from('conversation_evaluations')
        .insert(evaluationsWithAnalysisId)
        .select()

      if (evaluationsError) {
        console.error('❌ Error creating evaluations:', evaluationsError)
        console.error('   Message:', evaluationsError.message)
        console.error('   Details:', evaluationsError.details)
        console.error('   Hint:', evaluationsError.hint)

        // CRITICAL: Delete the analysis if evaluations fail
        console.log('🗑️ Rolling back analysis due to evaluation failure...')
        await supabase
          .from('performance_analyses')
          .delete()
          .eq('id', analysis.id)

        return NextResponse.json(
          {
            error: 'Failed to save evaluations',
            details: evaluationsError.message,
            hint: 'Analysis was rolled back. Please try again.'
          },
          { status: 500 }
        )
      } else {
        console.log(`✅ ${insertedEvaluations?.length || 0} evaluations created successfully`)
      }
    } else {
      console.warn('⚠️ No evaluations provided - analysis created without evaluations')
    }

    return NextResponse.json({
      success: true,
      analysis: analysis  // Changed from 'data' to 'analysis'
    })

  } catch (error) {
    console.error('Error in create-analysis API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    let query = supabase
      .from('performance_analyses')
      .select(`
        *,
        evaluations:conversation_evaluations(count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (botId) {
      query = query.eq('bot_id', botId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching performance analyses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch performance analyses', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Error in get analyses API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
