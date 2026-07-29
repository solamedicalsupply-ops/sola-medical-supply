const CODE_PATTERN = /^SOLA-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const code = String(request.query.code || '').trim().toUpperCase();
  if (!CODE_PATTERN.test(code)) {
    return response.status(400).json({ error: 'Please enter a valid SOLA tracking code.' });
  }

  const baseUrl = String(process.env.SOLA_ADMIN_API_BASE_URL || '').replace(/\/+$/, '');
  if (!/^https:\/\//.test(baseUrl)) {
    return response.status(503).json({ error: 'Tracking is temporarily unavailable.' });
  }

  try {
    const upstream = await fetch(`${baseUrl}/api/public/tracking/${encodeURIComponent(code)}`, {
      headers: {
        accept: 'application/json',
        'user-agent': 'SOLA-Public-Tracking/1.0',
        'x-forwarded-for': request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown'
      },
      cache: 'no-store'
    });
    const payload = await upstream.json().catch(() => ({ error: 'Tracking is temporarily unavailable.' }));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return response.status(upstream.status).json(payload);
  } catch {
    return response.status(502).json({ error: 'Tracking is temporarily unavailable. Please try again.' });
  }
};
