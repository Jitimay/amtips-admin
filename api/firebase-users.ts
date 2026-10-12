import type { VercelRequest, VercelResponse } from '@vercel/node'

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'fallback-secret-token-for-admin-session-123'
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    sub: FIREBASE_CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase',
  }

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')

  const signingInput = `${encode(header)}.${encode(payload)}`

  // Sign with RS256 using Web Crypto
  const keyData = FIREBASE_PRIVATE_KEY!
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryKey = Buffer.from(keyData, 'base64')
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(signingInput)
  )
  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const tokenData = await tokenRes.json() as any
  return tokenData.access_token
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.cookies?.admin_token
  if (!token || token !== ADMIN_SESSION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    return res.status(500).json({ error: 'Missing Firebase env vars' })
  }

  try {
    const accessToken = await getAccessToken()
    const emails: string[] = []
    let nextPageToken: string | undefined

    do {
      const url = new URL(`https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts:query`)
      const body: any = { returnUserInfo: true, maxResults: 1000 }
      if (nextPageToken) body.nextPageToken = nextPageToken

      const r = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const data = await r.json() as any
      if (!r.ok) return res.status(500).json({ error: data })

      for (const user of data.userInfo ?? []) {
        if (user.email) emails.push(user.email)
      }
      nextPageToken = data.nextPageToken
    } while (nextPageToken)

    return res.status(200).json({ emails, count: emails.length })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
