import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminShell from './pages/AdminShell'

function Inner() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <AdminShell /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  )
}
