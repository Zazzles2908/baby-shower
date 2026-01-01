// API Route: POST /api/guestbook
// Handles guestbook submissions

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    const { name, relationship, message, photoURL } = req.body;

    if (!name || !relationship || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Write to Supabase using activity_data JSONB column
    const activityData = {
      relationship: relationship,
      message: message,
      photo_url: photoURL || null
    };

    const supabaseResult = await writeToSupabase({
      name: name,
      activity_type: 'guestbook',
      activity_data: activityData
    });

    // Trigger Google Sheets webhook if configured
    if (process.env.GOOGLE_WEBHOOK_URL) {
      try {
        await fetch(process.env.GOOGLE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet: 'Guestbook',
            data: {
              Timestamp: new Date().toISOString(),
              Name: name,
              Relationship: relationship,
              Message: message,
              PhotoURL: photoURL || ''
            }
          })
        });
      } catch (webhookError) {
        console.warn('Google Sheets webhook failed:', webhookError);
      }
    }

    res.status(200).json({
      result: 'success',
      message: 'Wish saved successfully!',
      data: supabaseResult
    });

  } catch (error) {
    console.error('Guestbook API Error:', error);
    res.status(500).json({
      result: 'error',
      error: error.message
    });
  }
}

async function writeToSupabase(data) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/baby_shower.submissions`, {
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
