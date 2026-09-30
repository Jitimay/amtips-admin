import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import DashboardPage from './DashboardPage'
import UsersPage from './UsersPage'
import PaymentsPage from './PaymentsPage'
import WithdrawalsPage from './WithdrawalsPage'
import TipsPage from './TipsPage'
import CampaignsPage from './CampaignsPage'

type Page = 'dashboard' | 'users' | 'payments' | 'withdrawals' | 'tips' | 'campaigns'

export default function AdminShell() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const pageMap: Record<Page, React.ReactNode> = {
    dashboard: <DashboardPage />,
    users: <UsersPage />,
    payments: <PaymentsPage />,
    withdrawals: <WithdrawalsPage />,
    tips: <TipsPage />,
    campaigns: <CampaignsPage />,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar current={currentPage} onNavigate={setCurrentPage} />
      <main style={{
        marginLeft: 240,
        flex: 1,
        padding: '32px 36px',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}>
        {pageMap[currentPage]}
      </main>
    </div>
  )
}
