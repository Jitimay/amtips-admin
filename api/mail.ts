import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const MAIL_FROM = process.env.MAIL_FROM || 'amTips <noreply@amtips.app>'
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'fallback-secret-token-for-admin-session-123'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth check
  const token = req.cookies?.admin_token
  if (!token || token !== ADMIN_SESSION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Missing Supabase env vars' })
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const emails: string[] = []
    let page = 1
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000, page })
      if (error) return res.status(500).json({ error: error.message })
      data.users.forEach(u => {
        // email can be on u.email or inside u.identities
        const email = u.email
          || u.identities?.find((id: any) => id.identity_data?.email)?.identity_data?.email
          || null
        if (email) emails.push(email)
      })
      if (data.users.length < 1000) break
      page++
    }
    return res.status(200).json({ emails, count: emails.length, debug_first3: await (async () => {
      const { data } = await admin.auth.admin.listUsers({ perPage: 3, page: 1 })
      return data.users.map(u => ({ email: u.email, phone: u.phone, providers: u.identities?.map((i: any) => i.provider) }))
    })() })
  }

  if (req.method === 'POST') {
    const { subject, html, emails } = req.body as { subject: string; html: string; emails: string[] }
    if (!subject || !html || !emails?.length) {
      return res.status(400).json({ error: 'subject, html, and emails are required' })
    }
    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY is not configured' })
    }

    // Send in batches of 50 (Resend batch limit)
    const BATCH = 50
    let sent = 0
    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH)
      const r = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch.map(to => ({ from: MAIL_FROM, to, subject, html }))),
      })
      if (!r.ok) {
        const err = await r.text()
        return res.status(500).json({ error: `Resend error: ${err}`, sent })
      }
      sent += batch.length
    }

    return res.status(200).json({ ok: true, sent })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
