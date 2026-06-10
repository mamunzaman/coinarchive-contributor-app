import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AdminRoute() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' && user?.status === 'approved'

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
