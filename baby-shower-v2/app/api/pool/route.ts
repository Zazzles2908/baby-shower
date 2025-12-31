import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, dateGuess, timeGuess, weightGuess, lengthGuess } = body

    if (!name || !dateGuess || !timeGuess || !weightGuess || !lengthGuess) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('baby_shower.submissions')
      .insert({
        name,
        activity_type: 'pool',
        activity_data: {
          date_guess: dateGuess,
          time_guess: timeGuess,
          weight_guess: parseFloat(weightGuess),
          length_guess: parseInt(lengthGuess),
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
      message: 'Prediction saved!',
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}