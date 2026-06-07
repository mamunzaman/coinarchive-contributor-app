import { Outlet } from 'react-router-dom'
import { isAdminSession } from '../../lib/auth'
import { ForbiddenPage } from '../../pages/ForbiddenPage'

export function AdminRoute() {
  if (!isAdminSession()) {
    return <ForbiddenPage />
  }

  return <Outlet />
}
