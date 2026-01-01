// API Route: POST /api/quiz
// Handles emoji pictionary quiz submissions

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL;

// Quiz answer key
const CORRECT_ANSWERS = {
  puzzle1: 'Baby Shower',
  puzzle2: 'Three Little Pigs',
  puzzle3: 'Rock a Bye Baby',
  puzzle4: 'Baby Bottle',
  puzzle5: 'Diaper Change'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, puzzle1, puzzle2, puzzle3, puzzle4, puzzle5 } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Calculate score
    let score = 0;
    const answers = [puzzle1, puzzle2, puzzle3, puzzle4, puzzle5];
    
    Object.keys(CORRECT_ANSWERS).forEach((key, index) => {
      const puzzleKey = 'puzzle' + (index + 1);
      const answer = answers[index];
      if (answer && answer.toLowerCase() === CORRECT_ANSWERS[puzzleKey].toLowerCase()) {
        score++;
      }
    });

    // Prepare data for Supabase
    const submissionData = {
      name: name,
      activity_type: 'quiz',
      activity_data: {
        puzzle1: puzzle1 || '',
        puzzle2: puzzle2 || '',
        puzzle3: puzzle3 || '',
        puzzle4: puzzle4 || '',
        puzzle5: puzzle5 || '',
        score: score
      }
    };

    // Write to Supabase
    const supabaseResult = await writeToSupabase(submissionData);

    // Trigger Google Sheets webhook if configured
    if (GOOGLE_WEBHOOK_URL) {
      try {
        await fetch(GOOGLE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet: 'QuizAnswers',
            data: {
              Timestamp: new Date().toISOString(),
              Name: name,
              Puzzle1: puzzle1 || '',
              Puzzle2: puzzle2 || '',
              Puzzle3: puzzle3 || '',
              Puzzle4: puzzle4 || '',
              Puzzle5: puzzle5 || '',
              Score: score
            }
          })
        });
      } catch (webhookError) {
        console.warn('Google Sheets webhook failed:', webhookError);
      }
    }

    res.status(200).json({
      result: 'success',
      message: `You got ${score}/5 correct!`,
      score: score,
      data: supabaseResult
    });

  } catch (error) {
    console.error('Quiz API Error:', error);
    res.status(500).json({
      result: 'error',
      error: error.message
    });
  }
}

async function writeToSupabase(data) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Supabase error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to write to Supabase: ${error.message}`);
  }
}
