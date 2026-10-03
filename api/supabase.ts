import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Verify admin session cookie
    const token = req.cookies?.admin_token;
    if (!token || token !== process.env.ADMIN_SESSION_SECRET) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid admin session' });
    }

    // 2. Extract the actual Supabase path from req.url
    // req.url will be something like "/api/supabase/rest/v1/profiles?select=*"
    // We want to map this to "https://<supabase-url>/rest/v1/profiles?select=*"
    let path = req.url || '';
    if (path.startsWith('/api/supabase')) {
      path = path.replace('/api/supabase', '');
    }

    const targetUrl = `${SUPABASE_URL}${path}`;

    // 3. Forward the request
    const headers = new Headers();
    // Copy safe headers from original request
    for (const [key, value] of Object.entries(req.headers)) {
      if (
        ['content-type', 'accept', 'prefer', 'range', 'content-profile'].includes(key.toLowerCase())
      ) {
        if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
      }
    }

    // Inject service role key to bypass RLS securely server-side
    headers.set('apikey', SUPABASE_SERVICE_ROLE_KEY);
    headers.set('authorization', `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`);

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 4. Relay response back to client
    const responseData = await response.text();
    
    // Copy response headers (like content-type, content-range, etc)
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status).send(responseData);
  } catch (err: any) {
    console.error('Supabase Proxy Error:', err);
    res.status(500).json({ error: 'Internal Server Proxy Error' });
  }
}
