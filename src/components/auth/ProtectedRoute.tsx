import { Navigate, Outlet } from 'react-router-dom'
import { clearStaleAuthSession, isApprovedSession } from '../../lib/auth'

export function ProtectedRoute() {
  clearStaleAuthSession()

  if (!isApprovedSession()) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
