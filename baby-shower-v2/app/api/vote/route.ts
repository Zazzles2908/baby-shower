import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, selectedNames } = body

    if (!name || !selectedNames) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    const names = selectedNames.split(',').map((n: string) => n.trim())

    const { data, error } = await supabase
      .from('baby_shower.submissions')
      .insert({
        name,
        activity_type: 'voting',
        activity_data: {
          names: names,
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
      message: 'Votes recorded!',
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}