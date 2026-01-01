// API Route: POST /api/quiz
// Handles emoji pictionary quiz submissions

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL;

// Quiz answer key
const CORRECT_ANSWERS = {
  activity_data: {
        puzzle1: puzzle1 || '',
        puzzle2: puzzle2 || '',
        puzzle3: puzzle3 || '',
        puzzle4: puzzle4 || '',
        puzzle5: puzzle5 || '',
        score: score
      }
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
