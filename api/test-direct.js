// Test direct SQL query via Supabase RPC
// If this works, I'll convert all API endpoints

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use direct SQL via RPC
    const query = `
      INSERT INTO public.submissions (name, relationship, message, activity_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    
    const values = ['Test', 'Friend', 'Direct SQL test', 'guestbook'];
    
    // Use Supabase RPC to execute SQL directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        params: values
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SQL error: ${error}`);
    }

    const result = await response.json();
    
    res.status(200).json({
      result: 'success',
      data: result
    });

  } catch (error) {
    console.error('Direct SQL error:', error);
    res.status(500).json({
      result: 'error',
      error: error.message
    });
  }
}
