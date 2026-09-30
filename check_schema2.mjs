import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://ygtgfqitctowlhkqomjw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlndGdmcWl0Y3Rvd2xoa3FvbWp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njg2NjQ1MSwiZXhwIjoyMTAyNDQyNDUxfQ.uEYzsuGlECZy69LMvSU3OYKeY3vA8vPRV1_pKSsYm7k',
  { auth: { persistSession: false } }
)

// Check extra tables
const extra = ['payment_accounts', 'notifications', 'fcm_tokens', 'waiter_slots', 'settings']
for (const t of extra) {
  const { data, error } = await supabase.from(t).select('*').limit(1)
  if (error) console.log(`TABLE: ${t} => ERROR: ${error.message}`)
  else console.log(`TABLE: ${t} => COLUMNS: ${data && data[0] ? Object.keys(data[0]).join(', ') : '(empty)'}`)
}

// Check count of each main table
for (const t of ['profiles', 'wallets', 'tips', 'payments', 'withdrawals']) {
  const { count } = await supabase.from(t).select('*', { count: 'exact', head: true })
  console.log(`COUNT ${t}: ${count}`)
}

// Check total wallet balance
const { data: wallets } = await supabase.from('wallets').select('balance, pending_balance')
const total = (wallets ?? []).reduce((s, w) => s + (w.balance ?? 0), 0)
const pending = (wallets ?? []).reduce((s, w) => s + (w.pending_balance ?? 0), 0)
console.log(`\nTotal wallet balance: ${total} BIF`)
console.log(`Total pending balance: ${pending} BIF`)

// payments join tips join profiles
const { data: pay } = await supabase.from('payments').select('id, tip_id, tip_amount, tips(waiter_id, profiles:waiter_id(full_name, username))').limit(2)
console.log('\nPayments join sample:', JSON.stringify(pay).slice(0, 500))
