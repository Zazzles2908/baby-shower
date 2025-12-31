import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, relationship, message, photoURL } = body

    if (!name || !relationship || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('baby_shower.submissions')
      .insert({
        name,
        activity_type: 'guestbook',
        activity_data: {
          relationship,
          message,
          photo_url: photoURL || null,
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
      message: 'Wish saved successfully!',
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}