import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatBIF, formatDate, statusClass } from '../lib/utils'
import { downloadCSV } from '../lib/csv'
import { RefreshCw, Search, Download } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  async function load() {
    setLoading(true)
    let query = supabase
      .from('payments')
      .select(`
        id, tip_id, tip_amount, gateway_fee, platform_fee,
        customer_pays, currency, status, payment_method,
        transaction_ref, provider, created_at, confirmed_at,
        tips (waiter_id, profiles:waiter_id (full_name, username))
      `)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (search.trim()) query = query.or(`provider.ilike.%${search}%,transaction_ref.ilike.%${search}%`)

    const { data } = await query
    setPayments(data ?? [])
    setLoading(false)
  }

  async function downloadPayments() {
    const { data } = await supabase
      .from('payments')
      .select('id, tip_id, tip_amount, gateway_fee, platform_fee, customer_pays, currency, status, provider, payment_method, transaction_ref, created_at, confirmed_at')
      .order('created_at', { ascending: false })
    downloadCSV(`amtips_payments_${new Date().toISOString().slice(0,10)}.csv`, data ?? [])
  }

  useEffect(() => { load() }, [page, statusFilter])
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); load() }, 400)
    return () => clearTimeout(t)
  }, [search])

  const totalTipAmount = payments.reduce((s, p) => s + (p.tip_amount ?? 0), 0)
  const totalFees = payments.reduce((s, p) => s + (p.gateway_fee ?? 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Payments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            All payment transactions · Page total: <span style={{ color: '#22d3a5' }}>{formatBIF(totalTipAmount)}</span> ·
            Gateway fees: <span style={{ color: '#f59e0b' }}>{formatBIF(totalFees)}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={downloadPayments} style={{
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search provider, ref..."
            style={{ paddingLeft: 40, width: 260 }}
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="glass" style={{ padding: '0 0 4px' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Waiter</th>
              <th>Provider / Method</th>
              <th>Tip Amount</th>
              <th>Gateway Fee</th>
              <th>Customer Pays</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading payments…</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No payments found</td></tr>
            ) : payments.map(p => {
              const profile = p.tips?.profiles
              return (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{p.id.slice(0, 8)}…</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{profile?.full_name ?? '—'}</div>
                    {profile?.username && <div style={{ fontSize: 12, color: '#6c63ff' }}>@{profile.username}</div>}
                  </td>
                  <td>
                    <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: 12, color: '#6c63ff' }}>{p.provider ?? p.payment_method ?? '—'}</span>
                  </td>
                  <td style={{ color: '#22d3a5', fontWeight: 700 }}>{formatBIF(p.tip_amount)}</td>
                  <td style={{ color: '#f59e0b' }}>{formatBIF(p.gateway_fee)}</td>
                  <td>{formatBIF(p.customer_pays)}</td>
                  <td><span className={`status-badge ${statusClass(p.status)}`}>{p.status}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(p.created_at)}</td>
                  <td>
                    {p.status !== 'completed' && (
                      <button
                        onClick={async () => {
                          const ref = prompt('Enter Bank / Provider Reference Number (e.g., TREF...):')
                          if (!ref) return
                          const now = new Date().toISOString()
                          await supabase.from('payments').update({
                            status: 'completed',
                            confirmed_at: now,
                            transaction_ref: ref,
                            payment_method: 'MANUAL_APPROVAL',
                            updated_at: now
                          }).eq('id', p.id)
                          if (p.tip_id) {
                            await supabase.from('tips').update({
                              status: 'completed',
                              transaction_reference: ref,
                              updated_at: now
                            }).eq('id', p.tip_id)
                          }
                          alert('Payment marked as completed and waiter credited successfully!')
                          load()
                        }}
                        style={{
                          padding: '4px 10px',
                          fontSize: 12,
                          background: 'rgba(34,211,165,0.15)',
                          color: '#22d3a5',
                          border: '1px solid rgba(34,211,165,0.3)',
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                      >
                        Approve
                      </button>
                    )}
                  </td>
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
          disabled={payments.length < PAGE_SIZE} style={{ opacity: payments.length < PAGE_SIZE ? 0.4 : 1, padding: '8px 16px' }}>Next →</button>
      </div>
    </div>
  )
}
