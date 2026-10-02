import type React from 'react'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Banknote, ArrowUpFromLine,
  TrendingUp, LogOut, Megaphone
} from 'lucide-react'

type Page = 'dashboard' | 'users' | 'payments' | 'withdrawals' | 'tips' | 'campaigns'

interface Props {
  current: Page
  onNavigate: (p: Page) => void
}

const NAV: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'users', label: 'Users', icon: <Users size={18} /> },
  { id: 'payments', label: 'Payments', icon: <Banknote size={18} /> },
  { id: 'withdrawals', label: 'Withdrawals', icon: <ArrowUpFromLine size={18} /> },
  { id: 'tips', label: 'Tips', icon: <TrendingUp size={18} /> },
  { id: 'campaigns', label: 'Campaigns', icon: <Megaphone size={18} /> },
]

export default function Sidebar({ current, onNavigate }: Props) {
  const { logout } = useAuth()

  return (
    <aside style={{
      width: 240, minHeight: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px',
      position: 'fixed', left: 0, top: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '8px 8px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #6c63ff, #22d3a5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>💸</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
              <span className="gradient-text">amTips</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Admin Dashboard</div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div style={{ padding: '8px 8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="live-dot" />
        <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>Live Data</span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(item => (
          <div
            key={item.id}
            className={`sidebar-item ${current === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          className="sidebar-item"
          onClick={logout}
          style={{ color: 'var(--accent-red)' }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  )
}
