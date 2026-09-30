import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatBIF, formatDate } from '../lib/utils'
import { Search, RefreshCw, Star, Building2, MapPin } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  async function load() {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select(`
        id, full_name, username, firebase_uid, owner_uid, slot, slot_name,
        restaurant_name, city, country, avatar_url, bio, is_active,
        average_rating, total_ratings, created_at,
        wallets (balance, currency, pending_balance)
      `)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search}%,username.ilike.%${search}%,restaurant_name.ilike.%${search}%`
      )
    }

    const { data } = await query
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); load() }, 400)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Users / Waiters</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>All registered profiles in amTips</p>
        </div>
        <button className="btn-primary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by full name, username, or restaurant..."
          style={{ width: '100%', maxWidth: 400, paddingLeft: 40 }}
        />
      </div>

      <div className="glass" style={{ padding: '0 0 4px' }}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Username</th>
              <th>Venue / City</th>
              <th>Slot</th>
              <th>Wallet Balance</th>
              <th>Rating</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
            ) : users.map(u => {
              const wallet = Array.isArray(u.wallets) ? u.wallets[0] : u.wallets
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : 'linear-gradient(135deg, #6c63ff, #22d3a5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff'
                      }}>
                        {!u.avatar_url && (u.full_name?.[0] || 'U')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          ID: {u.id?.slice(0, 8)}…
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: '#6c63ff', fontWeight: 500 }}>@{u.username || '—'}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {u.restaurant_name ? (
                        <>
                          <Building2 size={12} color="var(--text-muted)" />
                          <span>{u.restaurant_name}</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                    {u.city && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MapPin size={10} />
                        <span>{u.city}{u.country ? `, ${u.country}` : ''}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="status-badge status-requested">
                      Slot {u.slot ?? '—'} {u.slot_name ? `· ${u.slot_name}` : ''}
                    </span>
                  </td>
                  <td style={{ color: '#22d3a5', fontWeight: 600 }}>
                    {wallet ? formatBIF(wallet.balance) : '0 BIF'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span style={{ fontWeight: 600 }}>{Number(u.average_rating ?? 0).toFixed(1)}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({u.total_ratings ?? 0})</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(u.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          style={{ opacity: page === 0 ? 0.4 : 1, padding: '8px 16px' }}>
          ← Prev
        </button>
        <span style={{ color: 'var(--text-secondary)', padding: '8px 12px', fontSize: 14 }}>Page {page + 1}</span>
        <button className="btn-primary" onClick={() => setPage(p => p + 1)}
          disabled={users.length < PAGE_SIZE} style={{ opacity: users.length < PAGE_SIZE ? 0.4 : 1, padding: '8px 16px' }}>
          Next →
        </button>
      </div>
    </div>
  )
}
