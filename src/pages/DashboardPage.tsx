import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatBIF, formatDateShort } from '../lib/utils'
import { downloadCSV } from '../lib/csv'
import {
  Users, Banknote, ArrowUpFromLine, TrendingUp,
  Activity, RefreshCw, Download, DollarSign,
  CreditCard, ShieldCheck, UserCheck
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

interface Stats {
  totalUsers: number
  totalWalletBalance: number
  // tips
  totalTips: number
  completedTips: number
  totalAmountTipped: number
  anonymousTips: number
  // payments
  totalPayments: number
  completedPayments: number
  totalGatewayFees: number
  totalPlatformFees: number
  totalCustomerPays: number
  totalTipAmountFromPayments: number
  // withdrawals
  totalWithdrawals: number
  pendingWithdrawals: number
  completedWithdrawals: number
  totalWithdrawalsAmount: number
  // charts
  recentPayments: any[]
  dailyTips: any[]
  paymentsByProvider: any[]
}

const COLORS = ['#6c63ff', '#22d3a5', '#f59e0b', '#ef4444', '#a78bfa']

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
        // tips
        { count: totalTips },
        { data: tipsData },
        // payments - all
        { count: totalPayments },
        { data: allPayments },
        // withdrawals
        { count: totalWithdrawals },
        { data: withdrawalAmounts },
        { count: pendingWithdrawals },
        { count: completedWithdrawals },
        // charts
        { data: recentPayments },
        { data: tipsRaw },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('wallets').select('balance'),
        supabase.from('tips').select('*', { count: 'exact', head: true }),
        supabase.from('tips').select('amount, status, is_anonymous'),
        supabase.from('payments').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('tip_amount, gateway_fee, platform_fee, customer_pays, status, provider, payment_method'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }),
        supabase.from('withdrawals').select('amount').eq('status', 'completed'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'requested'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('payments')
          .select('id, tip_amount, gateway_fee, platform_fee, customer_pays, currency, status, provider, payment_method, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
        supabase.from('tips')
          .select('amount, created_at')
          .order('created_at', { ascending: true })
          .limit(120),
      ])

      const totalWalletBalance = (wallets ?? []).reduce((s, w) => s + (w.balance ?? 0), 0)
      const totalWithdrawalsAmount = (withdrawalAmounts ?? []).reduce((s, w) => s + (w.amount ?? 0), 0)

      const completed = (allPayments ?? []).filter(p => p.status === 'completed')
      const totalGatewayFees = completed.reduce((s, p) => s + (p.gateway_fee ?? 0), 0)
      const totalPlatformFees = completed.reduce((s, p) => s + (p.platform_fee ?? 0), 0)
      const totalCustomerPays = completed.reduce((s, p) => s + (p.customer_pays ?? 0), 0)
      const totalTipAmountFromPayments = completed.reduce((s, p) => s + (p.tip_amount ?? 0), 0)

      const completedTipsData = (tipsData ?? []).filter(t => t.status === 'completed')
      const totalAmountTipped = completedTipsData.reduce((s, t) => s + (t.amount ?? 0), 0)
      const completedTips = completedTipsData.length
      const anonymousTips = (tipsData ?? []).filter(t => t.is_anonymous).length

      // Provider breakdown
      const providerMap: Record<string, number> = {}
      for (const p of (allPayments ?? [])) {
        const key = p.provider ?? p.payment_method ?? 'Unknown'
        providerMap[key] = (providerMap[key] ?? 0) + 1
      }
      const paymentsByProvider = Object.entries(providerMap).map(([name, value]) => ({ name: name.toUpperCase(), value }))

      // Daily tips chart
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
        completedTips,
        totalAmountTipped,
        anonymousTips,
        totalPayments: totalPayments ?? 0,
        completedPayments: completed.length,
        totalGatewayFees,
        totalPlatformFees,
        totalCustomerPays,
        totalTipAmountFromPayments,
        totalWithdrawals: totalWithdrawals ?? 0,
        pendingWithdrawals: pendingWithdrawals ?? 0,
        completedWithdrawals: completedWithdrawals ?? 0,
        totalWithdrawalsAmount,
        recentPayments: recentPayments ?? [],
        dailyTips,
        paymentsByProvider,
      })
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  useEffect(() => { loadStats() }, [])

  async function downloadFinancialReport() {
    const { data } = await supabase
      .from('payments')
      .select('id, tip_amount, gateway_fee, platform_fee, customer_pays, currency, status, provider, payment_method, transaction_ref, created_at, confirmed_at')
      .order('created_at', { ascending: false })
    downloadCSV(`amtips_payments_${new Date().toISOString().slice(0, 10)}.csv`, data ?? [])
  }

  async function downloadSummaryReport() {
    if (!stats) return
    const rows = [{
      report_date: new Date().toISOString(),
      total_users: stats.totalUsers,
      total_tips_logged: stats.totalTips,
      completed_tips: stats.completedTips,
      total_amount_tipped_bif: stats.totalAmountTipped,
      anonymous_tips: stats.anonymousTips,
      total_payments: stats.totalPayments,
      completed_payments: stats.completedPayments,
      platform_fees_collected_bif: stats.totalPlatformFees,
      gateway_fees_bif: stats.totalGatewayFees,
      total_customer_paid_bif: stats.totalCustomerPays,
      total_withdrawals: stats.totalWithdrawals,
      pending_withdrawals: stats.pendingWithdrawals,
      completed_withdrawals: stats.completedWithdrawals,
      total_paid_out_bif: stats.totalWithdrawalsAmount,
      total_wallet_balance_bif: stats.totalWalletBalance,
    }]
    downloadCSV(`amtips_summary_${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  const TOP_CARDS = stats ? [
    {
      label: 'Total Amount Tipped', value: formatBIF(stats.totalAmountTipped),
      icon: <TrendingUp size={22} />, color: '#6c63ff',
      sub: `${stats.completedTips} completed tips · ${stats.anonymousTips} anonymous`,
    },
    {
      label: 'Platform Revenue', value: formatBIF(stats.totalPlatformFees),
      icon: <ShieldCheck size={22} />, color: '#22d3a5',
      sub: `Platform fees from ${stats.completedPayments} completed payments`,
    },
    {
      label: 'Gateway Fees Paid', value: formatBIF(stats.totalGatewayFees),
      icon: <CreditCard size={22} />, color: '#f59e0b',
      sub: 'Paid to payment providers (AfriPay, EcoCash…)',
    },
    {
      label: 'Total Customer Paid', value: formatBIF(stats.totalCustomerPays),
      icon: <DollarSign size={22} />, color: '#a78bfa',
      sub: 'Total charged to customers incl. all fees',
    },
    {
      label: 'Total Users', value: stats.totalUsers.toLocaleString(),
      icon: <Users size={22} />, color: '#38bdf8',
      sub: 'Registered profiles',
    },
    {
      label: 'Wallet Balance', value: formatBIF(stats.totalWalletBalance),
      icon: <Banknote size={22} />, color: '#22d3a5',
      sub: 'Total held in all waiter wallets',
    },
    {
      label: 'Paid Out', value: formatBIF(stats.totalWithdrawalsAmount),
      icon: <ArrowUpFromLine size={22} />, color: '#ef4444',
      sub: `${stats.completedWithdrawals} completed withdrawals`,
    },
    {
      label: 'Pending Withdrawals', value: stats.pendingWithdrawals.toLocaleString(),
      icon: <UserCheck size={22} />, color: '#f59e0b',
      sub: 'Awaiting admin approval',
    },
  ] : []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Financial Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={downloadSummaryReport} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,211,165,0.15)', color: '#22d3a5',
            border: '1px solid rgba(34,211,165,0.3)', borderRadius: 10,
            padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={14} />Summary CSV
          </button>
          <button onClick={downloadFinancialReport} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(108,99,255,0.15)', color: '#6c63ff',
            border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10,
            padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={14} />Payments CSV
          </button>
          <button className="btn-primary" onClick={loadStats} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} />Refresh
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ margin: '0 auto 12px' }} />
          <p>Loading financial data...</p>
        </div>
      ) : (
        <>
          {/* Revenue highlight banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(34,211,165,0.1))',
            border: '1px solid rgba(108,99,255,0.25)',
            borderRadius: 16, padding: '20px 28px', marginBottom: 24,
            display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                💰 Total Money Tipped (All Time)
              </p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#6c63ff' }}>{formatBIF(stats!.totalAmountTipped)}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                🏦 Platform Revenue Earned
              </p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#22d3a5' }}>{formatBIF(stats!.totalPlatformFees)}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                💳 Total Customer Payments
              </p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{formatBIF(stats!.totalCustomerPays)}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                📤 Total Paid Out to Waiters
              </p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>{formatBIF(stats!.totalWithdrawalsAmount)}</p>
            </div>
          </div>

          {/* Stat cards - 4 per row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {TOP_CARDS.map(card => (
              <div key={card.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{card.label}</p>
                    <p style={{ fontSize: 19, fontWeight: 700, lineHeight: 1 }}>{card.value}</p>
                  </div>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${card.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: card.color, flexShrink: 0, marginLeft: 8,
                  }}>
                    {card.icon}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Fee breakdown box */}
          <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>💼 Payment Fee Breakdown (Completed Transactions)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
              {[
                { label: 'Waiter Tip Amount', value: formatBIF(stats!.totalTipAmountFromPayments), color: '#6c63ff', pct: null },
                { label: 'Platform Fee (amTips)', value: formatBIF(stats!.totalPlatformFees), color: '#22d3a5', pct: stats!.totalCustomerPays > 0 ? ((stats!.totalPlatformFees / stats!.totalCustomerPays) * 100).toFixed(1) + '%' : '—' },
                { label: 'Gateway Fee (Provider)', value: formatBIF(stats!.totalGatewayFees), color: '#f59e0b', pct: stats!.totalCustomerPays > 0 ? ((stats!.totalGatewayFees / stats!.totalCustomerPays) * 100).toFixed(1) + '%' : '—' },
                { label: 'Total Customer Charged', value: formatBIF(stats!.totalCustomerPays), color: '#a78bfa', pct: '100%' },
                { label: 'Completed Payments', value: stats!.completedPayments.toString(), color: '#38bdf8', pct: `of ${stats!.totalPayments} total` },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--bg-secondary)', borderRadius: 12,
                  padding: '16px', border: `1px solid ${item.color}30`,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                  {item.pct && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{item.pct}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
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
                    <YAxis tick={{ fill: '#4a5880', fontSize: 11 }} tickFormatter={(v: any) => (v / 1000) + 'k'} />
                    <Tooltip
                      contentStyle={{ background: '#131929', border: '1px solid #1e2d47', borderRadius: 8 }}
                      labelStyle={{ color: '#8899bb' }}
                      formatter={(v: any) => [formatBIF(v), 'Amount']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6c63ff" fill="url(#tipGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Payments by Provider</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats!.paymentsByProvider}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="45%"
                      outerRadius={90}
                      label={(props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats!.paymentsByProvider.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#131929', border: '1px solid #1e2d47', borderRadius: 8 }}
                      formatter={(v: any) => [v + ' payments']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent payments table */}
          <div className="glass" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16 }}>Recent Payments (with fee breakdown)</h3>
              <button onClick={downloadFinancialReport} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(108,99,255,0.12)', color: '#6c63ff',
                border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8,
                padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                <Download size={12} />Download All
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Provider</th>
                  <th>Tip Amount</th>
                  <th>Platform Fee</th>
                  <th>Gateway Fee</th>
                  <th>Customer Pays</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats!.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>{p.id.slice(0, 8)}…</td>
                    <td style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: 12, color: '#6c63ff' }}>{p.provider ?? p.payment_method ?? '—'}</td>
                    <td style={{ color: '#22d3a5', fontWeight: 600 }}>{formatBIF(p.tip_amount)}</td>
                    <td style={{ color: '#6c63ff' }}>{formatBIF(p.platform_fee)}</td>
                    <td style={{ color: '#f59e0b' }}>{formatBIF(p.gateway_fee)}</td>
                    <td style={{ fontWeight: 600 }}>{formatBIF(p.customer_pays)}</td>
                    <td><span className={`status-badge ${p.status === 'completed' ? 'status-completed' : p.status === 'pending' ? 'status-pending' : 'status-failed'}`}>{p.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDateShort(p.created_at)}</td>
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
