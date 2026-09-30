import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ygtgfqitctowlhkqomjw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlndGdmcWl0Y3Rvd2xoa3FvbWp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njg2NjQ1MSwiZXhwIjoyMTAyNDQyNDUxfQ.uEYzsuGlECZy69LMvSU3OYKeY3vA8vPRV1_pKSsYm7k',
  { auth: { persistSession: false } }
)

const tables = ['profiles', 'wallets', 'tips', 'payments', 'withdrawals', 'push_campaigns']
for (const t of tables) {
  const { data, error } = await supabase.from(t).select('*').limit(2)
  if (error) {
    console.log(`TABLE: ${t} => ERROR: ${error.message}`)
  } else {
    const cols = data && data[0] ? Object.keys(data[0]).join(', ') : '(empty table)'
    console.log(`\nTABLE: ${t}`)
    console.log(`  COLUMNS: ${cols}`)
    if (data && data[0]) console.log(`  SAMPLE: ${JSON.stringify(data[0]).slice(0, 300)}`)
  }
}
