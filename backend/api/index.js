export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the URL path - handle both req.url and req.query
  const url = req.url || '';
  const method = req.method || '';

  // Route: GET /api
  if (method === 'GET' && url === '/api') {
    return res.status(200).json({ 
      message: 'Backend Running 🚀'
    });
  }

  // Route: GET /api/medicines
  if (method === 'GET' && url === '/api/medicines') {
    return res.status(200).json([
      { name: 'Paracetamol', stock: 45 },
      { name: 'Amoxicillin', stock: 20 }
    ]);
  }

  // Route: POST /api/ai
  if (method === 'POST' && url === '/api/ai') {
    return res.status(200).json({
      response: 'AI feature working'
    });
  }

  // Default 404 response
  return res.status(404).json({ 
    error: 'Route not found',
    available_routes: ['GET /api', 'GET /api/medicines', 'POST /api/ai']
  });
}
