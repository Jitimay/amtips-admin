import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatBIF, formatDate, statusClass } from '../lib/utils'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [updating, setUpdating] = useState<string | null>(null)
  const PAGE_SIZE = 25

  async function load() {
    setLoading(true)
    let query = supabase
      .from('withdrawals')
      .select(`
        id, amount, currency, status, waiter_id,
        payment_account_id, provider_reference, failure_reason,
        created_at, updated_at,
        profiles:waiter_id (full_name, username, firebase_uid)
      `)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    const { data } = await query

    // Also fetch payment account details for each withdrawal
    if (data && data.length > 0) {
      const accountIds = data.map(w => w.payment_account_id).filter(Boolean)
      if (accountIds.length > 0) {
        const { data: accounts } = await supabase
          .from('payment_accounts')
          .select('id, type, provider, account_identifier')
          .in('id', accountIds)
        
        const accountMap = new Map((accounts ?? []).map(a => [a.id, a]))
        data.forEach(w => {
          w.account_details = accountMap.get(w.payment_account_id)
        })
      }
    }

    setWithdrawals(data ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id)
    await supabase.from('withdrawals').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setUpdating(null)
    load()
  }

  useEffect(() => { load() }, [page, statusFilter])

  const pendingCount = withdrawals.filter(w => w.status === 'requested').length
  const totalAmount = withdrawals.reduce((s, w) => s + (w.amount ?? 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Withdrawals</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {pendingCount > 0 && (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: 4 }} />
                {pendingCount} pending ·{' '}
              </span>
            )}
            Page total: <span style={{ color: '#22d3a5' }}>{formatBIF(totalAmount)}</span>
          </p>
        </div>
        <button className="btn-primary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Status filter */}
      <div style={{ marginBottom: 20 }}>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
          <option value="all">All Statuses</option>
          <option value="requested">Requested (Pending)</option>
          <option value="completed">Completed</option>
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
              <th>Amount</th>
              <th>Payment Account</th>
              <th>Provider Ref</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading withdrawals…</td></tr>
            ) : withdrawals.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No withdrawals found</td></tr>
            ) : withdrawals.map(w => {
              const profile = w.profiles
              const acc = w.account_details
              return (
                <tr key={w.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{w.id.slice(0, 8)}…</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{profile?.full_name ?? '—'}</div>
                    {profile?.username && <div style={{ fontSize: 12, color: '#6c63ff' }}>@{profile.username}</div>}
                  </td>
                  <td style={{ color: '#22d3a5', fontWeight: 700 }}>{formatBIF(w.amount)}</td>
                  <td>
                    {acc ? (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', color: '#6c63ff' }}>
                          {acc.provider ?? acc.type}
                        </div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {acc.account_identifier}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {w.payment_account_id?.slice(0, 8) ?? '—'}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.provider_reference ?? '—'}</td>
                  <td><span className={`status-badge ${statusClass(w.status)}`}>{w.status}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(w.created_at)}</td>
                  <td>
                    {w.status === 'requested' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => updateStatus(w.id, 'completed')}
                          disabled={updating === w.id}
                          style={{
                            background: 'rgba(34,211,165,0.15)', color: '#22d3a5',
                            border: '1px solid rgba(34,211,165,0.3)', borderRadius: 8,
                            padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                          }}>
                          {updating === w.id ? '…' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => updateStatus(w.id, 'failed')}
                          disabled={updating === w.id}
                          style={{
                            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                            padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                          }}>
                          ✗ Reject
                        </button>
                      </div>
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
          disabled={withdrawals.length < PAGE_SIZE} style={{ opacity: withdrawals.length < PAGE_SIZE ? 0.4 : 1, padding: '8px 16px' }}>Next →</button>
      </div>
    </div>
  )
}
