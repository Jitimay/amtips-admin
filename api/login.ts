import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'amtips@admin2026';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'fallback-secret-token-for-admin-session-123';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const { password } = req.body || {};
    
    if (password === ADMIN_PASSWORD) {
      // Set secure HTTP-only cookie
      res.setHeader(
        'Set-Cookie',
        `admin_token=${ADMIN_SESSION_SECRET}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
      );
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: 'Invalid password' });
    }
  }

  if (req.method === 'DELETE') {
    // Logout
    res.setHeader(
      'Set-Cookie',
      `admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`
    );
    return res.status(200).json({ success: true });
  }

  // Check auth status
  if (req.method === 'GET') {
    const token = req.cookies?.admin_token;
    if (token === ADMIN_SESSION_SECRET) {
      return res.status(200).json({ isAuthenticated: true });
    }
    return res.status(200).json({ isAuthenticated: false });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
