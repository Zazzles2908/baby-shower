// API Route: GET /api
// Health check endpoint

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      result: 'success',
      message: 'Baby Shower API is running',
      endpoints: [
        'POST /api/guestbook',
        'POST /api/pool',
        'POST /api/quiz',
        'POST /api/advice',
        'POST /api/vote'
      ],
      timestamp: new Date().toISOString()
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
