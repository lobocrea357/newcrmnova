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
    const { evaluations } = await request.json()

    if (!evaluations || !Array.isArray(evaluations)) {
      return NextResponse.json(
        { error: 'evaluations array is required' },
        { status: 400 }
      )
    }

    if (evaluations.length === 0) {
      return NextResponse.json(
        { error: 'evaluations array cannot be empty' },
        { status: 400 }
      )
    }

    // Validate each evaluation has required fields
    for (const evaluation of evaluations) {
      if (!evaluation.conversation_id && !evaluation.chat_id) {
        return NextResponse.json(
          { error: 'Each evaluation must have either conversation_id or chat_id' },
          { status: 400 }
        )
      }
    }

    // Add timestamps to evaluations
    const evaluationsWithTimestamps = evaluations.map(evaluation => ({
      ...evaluation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // Insert evaluations into database
    const { data, error } = await supabase
      .from('conversation_evaluations')
      .insert(evaluationsWithTimestamps)
      .select()

    if (error) {
      console.error('Error saving evaluations:', error)
      return NextResponse.json(
        { error: 'Failed to save evaluations', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ ${data?.length || 0} evaluations saved successfully`)

    return NextResponse.json({
      success: true,
      data: data,
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Error in save-evaluations API:', error)
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
    const botId = searchParams.get('botId')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    let query = supabase
      .from('conversation_evaluations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (analysisId) {
      query = query.eq('performance_analysis_id', analysisId)
    }

    if (botId) {
      query = query.eq('bot_id', botId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching evaluations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch evaluations', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Error in get evaluations API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
