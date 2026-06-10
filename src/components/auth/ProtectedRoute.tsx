import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function AuthRouteLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p role="status" aria-live="polite" className="text-sm text-navy-muted">
        Loading…
      </p>
    </div>
  )
}

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return <AuthRouteLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
