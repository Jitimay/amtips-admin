import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminShell from './pages/AdminShell'

function Inner() {
  const { isAuthenticated, isReady } = useAuth()
  if (!isReady) return <div style={{ minHeight: '100vh', background: '#0a0e1a' }} />
  return isAuthenticated ? <AdminShell /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  )
}
