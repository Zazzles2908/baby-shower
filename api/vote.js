// API Route: POST /api/vote
// Handles baby name voting submissions

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL;

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
    const { name, selectedNames } = req.body;

    if (!name || !selectedNames || !Array.isArray(selectedNames)) {
      return res.status(400).json({ error: 'Missing required fields or invalid format' });
    }

    // Limit to 3 votes per person
    if (selectedNames.length > 3) {
      return res.status(400).json({ error: 'Maximum 3 votes allowed' });
    }

    // Write to Supabase
    const supabaseResult = await writeToSupabase({
      name,
      activity_data.selected_names: selectedNames.join(','),
      activity_type: 'voting'
    });

    // Trigger Google Sheets webhook if configured
    if (GOOGLE_WEBHOOK_URL) {
      try {
        await fetch(GOOGLE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet: 'NameVotes',
            data: {
              Timestamp: new Date().toISOString(),
              Name: name,
              SelectedNames: selectedNames.join(',')
            }
          })
        });
      } catch (webhookError) {
        console.warn('Google Sheets webhook failed:', webhookError);
      }
    }

    res.status(200).json({
      result: 'success',
      message: 'Votes recorded!',
      data: supabaseResult
    });

  } catch (error) {
    console.error('Vote API Error:', error);
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
