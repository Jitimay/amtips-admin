/**
 * Secure server-side proxy for admin data queries.
 * The service_role key NEVER leaves the server.
 * All requests must present a valid Supabase session token belonging to an admin user.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

// Service role client — only exists server-side, never sent to browser
const adminDb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Anon client for verifying the caller's session token
const anonDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

type TableName = 'profiles' | 'tips' | 'payments' | 'withdrawals' | 'campaigns' | 'notifications' | 'wallets';

const ALLOWED_TABLES: TableName[] = ['profiles', 'tips', 'payments', 'withdrawals', 'campaigns', 'notifications', 'wallets'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── 1. Verify Bearer token ────────────────────────────────────────────────
  const auth = req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: { user }, error: userErr } = await anonDb.auth.getUser(token);
  if (userErr || !user) return res.status(401).json({ error: 'Invalid or expired session' });

  // ── 2. Verify the user is the designated admin ────────────────────────────
  if (user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden: not an admin user' });
  }

  // ── 3. Parse and validate query params ───────────────────────────────────
  const {
    table,
    select = '*',
    filters = [],
    order,
    limit,
    offset,
    update,
    id,
  } = req.body as {
    table: TableName;
    select?: string;
    filters?: Array<{ col: string; op: string; val: unknown }>;
    order?: { col: string; ascending?: boolean };
    limit?: number;
    offset?: number;
    update?: Record<string, unknown>;
    id?: string;
  };

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: `Table '${table}' not allowed` });
  }

  try {
    // ── UPDATE path ─────────────────────────────────────────────────────────
    if (update && id) {
      const { error } = await adminDb.from(table).update(update).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ── SELECT path ─────────────────────────────────────────────────────────
    let q = adminDb.from(table).select(select);
    for (const f of filters) {
      if (f.op === 'eq') q = (q as any).eq(f.col, f.val);
      else if (f.op === 'gte') q = (q as any).gte(f.col, f.val);
      else if (f.op === 'lte') q = (q as any).lte(f.col, f.val);
      else if (f.op === 'like') q = (q as any).like(f.col, f.val);
      else if (f.op === 'in') q = (q as any).in(f.col, f.val as unknown[]);
    }
    if (order) q = (q as any).order(order.col, { ascending: order.ascending ?? false });
    if (limit) q = (q as any).limit(limit);
    if (offset) q = (q as any).range(offset, offset + (limit ?? 50) - 1);

    const { data, error, count } = await (q as any);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ data, count });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
