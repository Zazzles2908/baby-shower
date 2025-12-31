import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, adviceType, message } = body

    if (!name || !adviceType || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('baby_shower.submissions')
      .insert({
        name,
        activity_type: 'advice',
        activity_data: {
          advice_type: adviceType,
          message,
        },
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Advice saved!',
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}