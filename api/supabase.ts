import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 0. Verify env vars are present
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase Proxy: Missing env vars. SUPABASE_URL:', !!SUPABASE_URL, 'SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
      return res.status(500).json({ error: 'Server misconfiguration: missing Supabase env vars' });
    }

    // 1. Verify admin session cookie
    const token = req.cookies?.admin_token;
    const expectedToken = process.env.ADMIN_SESSION_SECRET || 'fallback-secret-token-for-admin-session-123';

    if (!token || token !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid admin session' });
    }

    // 2. Build target Supabase URL
    // req.url = "/api/supabase/rest/v1/profiles?select=*"
    // target  = "https://xxx.supabase.co/rest/v1/profiles?select=*"
    let path = req.url || '';
    path = path.replace(/^\/api\/supabase/, '');

    const targetUrl = `${SUPABASE_URL}${path}`;
    console.log('[Proxy] →', req.method, targetUrl);

    // 3. Forward the request with service role key injected
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (['content-type', 'accept', 'prefer', 'range', 'content-profile'].includes(lower)) {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(',') : String(value));
        }
      }
    }
    headers.set('apikey', SUPABASE_SERVICE_ROLE_KEY);
    headers.set('authorization', `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`);

    const fetchOptions: RequestInit = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseData = await response.text();

    console.log('[Proxy] ←', response.status, responseData.slice(0, 200));

    // 4. Relay only safe headers back
    const safeHeaders = ['content-type', 'content-range', 'content-profile', 'x-total-count'];
    response.headers.forEach((value, key) => {
      if (safeHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status).send(responseData);

  } catch (err: any) {
    console.error('Supabase Proxy Error:', err?.message || err);
    res.status(500).json({ error: 'Internal Server Proxy Error', detail: err?.message });
  }
}
