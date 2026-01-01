// API Route: POST /api/guestbook
// Handles guestbook submissions, writes to Supabase and triggers Google Sheets webhook

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_WEBHOOK_URL; // Optional: for Sheets backup

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, relationship, message, photoURL } = req.body;

    // Validate required fields
    if (!name || !relationship || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Write to Supabase (Primary)
    const supabaseResult = await writeToSupabase({
      name,
      relationship,
      message,
      photo_url: photoURL || null,
      activity_type: 'guestbook'
    });

    // 2. Trigger Google Sheets webhook if configured (Backup)
    if (GOOGLE_WEBHOOK_URL) {
      try {
        await fetch(GOOGLE_WEBHOOK_URL, {
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
        // Don't fail the request if webhook fails
      }
    }

    // 3. Return success response
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

/**
 * Write submission to Supabase
 */
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
