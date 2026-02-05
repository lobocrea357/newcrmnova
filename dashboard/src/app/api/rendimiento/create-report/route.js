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
    const { reportData } = await request.json()

    if (!reportData) {
      return NextResponse.json(
        { error: 'reportData is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!reportData.performance_analysis_id) {
      return NextResponse.json(
        { error: 'performance_analysis_id is required' },
        { status: 400 }
      )
    }

    // Create the report in the database
    const { data, error } = await supabase
      .from('performance_reports')
      .insert([{
        ...reportData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating performance report:', error)
      return NextResponse.json(
        { error: 'Failed to create performance report', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Performance report created successfully:', data?.id)

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Error in create-report API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

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

    // Get reports for the analysis
    const { data, error } = await supabase
      .from('performance_reports')
      .select('*')
      .eq('performance_analysis_id', analysisId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching performance reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch performance reports', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Error in get reports API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
