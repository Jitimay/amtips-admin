import { createClient } from '@supabase/supabase-js'

// We route all Supabase calls through our secure Vercel API proxy.
// The proxy holds the service_role key and verifies the HTTP-only admin session cookie.
// Must be an absolute URL for Supabase JS client
const PROXY_URL = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/supabase` 
  : 'http://localhost:3000/api/supabase'

// The anon key is safe to be exposed. We use it just to satisfy the client initialization.
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string || 'dummy-key'

export const supabase = createClient(PROXY_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})
