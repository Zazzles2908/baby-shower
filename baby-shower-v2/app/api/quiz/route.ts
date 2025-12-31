import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabase'

const QUIZ_ANSWERS = {
  puzzle1: 'Baby Shower',
  puzzle2: 'Three Little Pigs',
  puzzle3: 'Rock a Bye Baby',
  puzzle4: 'Baby Bottle',
  puzzle5: 'Diaper Change',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, puzzle1, puzzle2, puzzle3, puzzle4, puzzle5 } = body

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate score
    let score = 0
    const answers = [puzzle1, puzzle2, puzzle3, puzzle4, puzzle5]

    for (let i = 0; i < 5; i++) {
      const puzzleKey = `puzzle${i + 1}`
      const userAnswer = answers[i]
      const correctAnswer = (QUIZ_ANSWERS as any)[puzzleKey]

      if (userAnswer && userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        score++
      }
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('baby_shower.submissions')
      .insert({
        name,
        activity_type: 'quiz',
        activity_data: {
          puzzle1,
          puzzle2,
          puzzle3,
          puzzle4,
          puzzle5,
          score,
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
      message: `You got ${score}/5 correct!`,
      score,
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}