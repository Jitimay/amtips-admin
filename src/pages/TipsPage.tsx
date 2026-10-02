import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatBIF, formatDate, statusClass } from '../lib/utils'
import { downloadCSV } from '../lib/csv'
import { RefreshCw, Search, Star, Download } from 'lucide-react'

export default function TipsPage() {
  const [tips, setTips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  async function load() {
    setLoading(true)
    let query = supabase
      .from('tips')
      .select(`
        id, amount, currency, status, rating, message, customer_name, is_anonymous, created_at,
        profiles:waiter_id (full_name, username)
      `)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (search.trim()) {
      query = query.or(`message.ilike.%${search}%,customer_name.ilike.%${search}%`)
    }

    const { data } = await query
    setTips(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [page, statusFilter])
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); load() }, 400)
    return () => clearTimeout(t)
  }, [search])

  const totalAmount = tips.reduce((s, t) => s + (t.amount ?? 0), 0)

  async function downloadTips() {
    const { data } = await supabase
      .from('tips')
      .select('id, waiter_id, amount, currency, status, rating, message, customer_name, is_anonymous, transaction_reference, payment_provider, created_at')
      .order('created_at', { ascending: false })
    downloadCSV(`amtips_tips_${new Date().toISOString().slice(0,10)}.csv`, data ?? [])
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Tips</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Page total: <span style={{ color: '#22d3a5' }}>{formatBIF(totalAmount)}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={downloadTips} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,211,165,0.12)', color: '#22d3a5',
            border: '1px solid rgba(34,211,165,0.25)', borderRadius: 10,
            padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={14} />Download CSV
          </button>
          <button className="btn-primary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} />Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by message or customer..." style={{ paddingLeft: 40, width: 280 }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="glass" style={{ padding: '0 0 4px' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Waiter</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Rating</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading tips…</td></tr>
            ) : tips.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No tips found</td></tr>
            ) : tips.map(t => {
              const profile = t.profiles
              return (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{t.id.slice(0, 8)}…</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{profile?.full_name ?? '—'}</div>
                    {profile?.username && <div style={{ fontSize: 12, color: '#6c63ff' }}>@{profile.username}</div>}
                  </td>
                  <td>
                    <span style={{ fontSize: 13 }}>
                      {t.is_anonymous ? <em>Anonymous</em> : t.customer_name || 'Guest'}
                    </span>
                  </td>
                  <td style={{ color: '#22d3a5', fontWeight: 700 }}>{formatBIF(t.amount)}</td>
                  <td>
                    {t.rating != null && t.rating > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={12} fill={s <= t.rating ? '#f59e0b' : 'transparent'} color="#f59e0b" />
                        ))}
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.rating}</span>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {t.message || '—'}
                  </td>
                  <td><span className={`status-badge ${statusClass(t.status)}`}>{t.status}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(t.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          style={{ opacity: page === 0 ? 0.4 : 1, padding: '8px 16px' }}>← Prev</button>
        <span style={{ color: 'var(--text-secondary)', padding: '8px 12px', fontSize: 14 }}>Page {page + 1}</span>
        <button className="btn-primary" onClick={() => setPage(p => p + 1)}
          disabled={tips.length < PAGE_SIZE} style={{ opacity: tips.length < PAGE_SIZE ? 0.4 : 1, padding: '8px 16px' }}>Next →</button>
      </div>
    </div>
  )
}
