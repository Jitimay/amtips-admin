import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatBIF, formatDateShort } from '../lib/utils'
import {
  Users, Banknote, ArrowUpFromLine, TrendingUp,
  Activity, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

interface Stats {
  totalUsers: number
  totalWalletBalance: number
  totalTips: number
  totalPaymentsCompleted: number
  totalWithdrawals: number
  totalWithdrawalsAmount: number
  pendingWithdrawals: number
  recentPayments: any[]
  dailyTips: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function loadStats() {
    setLoading(true)
    try {
      const [
        { count: totalUsers },
        { data: wallets },
        { count: totalTips },
        { count: paymentsCompleted },
        { count: totalWithdrawals },
        { data: withdrawalAmounts },
        { count: pendingWithdrawals },
        { data: recentPayments },
        { data: tipsRaw },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('wallets').select('balance'),
        supabase.from('tips').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }),
        supabase.from('withdrawals').select('amount').eq('status', 'completed'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'requested'),
        supabase.from('payments')
          .select('id, tip_amount, customer_pays, currency, status, provider, payment_method, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('tips')
          .select('amount, created_at')
          .order('created_at', { ascending: true })
          .limit(100),
      ])

      const totalWalletBalance = (wallets ?? []).reduce((s, w) => s + (w.balance ?? 0), 0)
      const totalWithdrawalsAmount = (withdrawalAmounts ?? []).reduce((s, w) => s + (w.amount ?? 0), 0)

      // Group tips by day for chart
      const dayMap: Record<string, number> = {}
      for (const tip of (tipsRaw ?? [])) {
        const day = formatDateShort(tip.created_at)
        dayMap[day] = (dayMap[day] ?? 0) + (tip.amount ?? 0)
      }
      const dailyTips = Object.entries(dayMap).slice(-14).map(([date, amount]) => ({ date, amount }))

      setStats({
        totalUsers: totalUsers ?? 0,
        totalWalletBalance,
        totalTips: totalTips ?? 0,
        totalPaymentsCompleted: paymentsCompleted ?? 0,
        totalWithdrawals: totalWithdrawals ?? 0,
        totalWithdrawalsAmount,
        pendingWithdrawals: pendingWithdrawals ?? 0,
        recentPayments: recentPayments ?? [],
        dailyTips,
      })
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  useEffect(() => { loadStats() }, [])

  const CARDS = stats ? [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: <Users size={22} />, color: '#6c63ff', sub: 'Registered profiles' },
    { label: 'Total Wallet Balance', value: formatBIF(stats.totalWalletBalance), icon: <Banknote size={22} />, color: '#22d3a5', sub: 'Across all waiters' },
    { label: 'Total Tips Logged', value: stats.totalTips.toLocaleString(), icon: <TrendingUp size={22} />, color: '#f59e0b', sub: 'All tips in database' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals.toLocaleString(), icon: <ArrowUpFromLine size={22} />, color: '#ef4444', sub: `${formatBIF(stats.totalWithdrawalsAmount)} total paid out` },
  ] : []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button className="btn-primary" onClick={loadStats} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading && !stats ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ margin: '0 auto 12px' }} />
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {CARDS.map(card => (
              <div key={card.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{card.label}</p>
                    <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{card.value}</p>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${card.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: card.color,
                  }}>
                    {card.icon}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Daily Tips Volume (BIF)</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats!.dailyTips}>
                    <defs>
                      <linearGradient id="tipGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
                    <XAxis dataKey="date" tick={{ fill: '#4a5880', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#4a5880', fontSize: 11 }} tickFormatter={v => (v / 1000) + 'k'} />
                    <Tooltip
                      contentStyle={{ background: '#131929', border: '1px solid #1e2d47', borderRadius: 8 }}
                      labelStyle={{ color: '#8899bb' }}
                      formatter={(v: number) => [formatBIF(v), 'Amount']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6c63ff" fill="url(#tipGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Withdrawals vs Payments</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Payments', value: stats!.totalPaymentsCompleted },
                    { name: 'Withdrawals', value: stats!.totalWithdrawals },
                    { name: 'Pending', value: stats!.pendingWithdrawals },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
                    <XAxis dataKey="name" tick={{ fill: '#4a5880', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#4a5880', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#131929', border: '1px solid #1e2d47', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="#22d3a5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent payments */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Recent Payments</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Provider / Method</th>
                  <th>Tip Amount</th>
                  <th>Customer Pays</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats!.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>{p.id.slice(0, 8)}…</td>
                    <td style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: 12, color: '#6c63ff' }}>{p.provider ?? p.payment_method ?? '—'}</td>
                    <td style={{ color: '#22d3a5', fontWeight: 600 }}>{formatBIF(p.tip_amount)}</td>
                    <td>{formatBIF(p.customer_pays)}</td>
                    <td><span className={`status-badge ${p.status === 'completed' ? 'status-completed' : p.status === 'pending' ? 'status-pending' : 'status-failed'}`}>{p.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDateShort(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
