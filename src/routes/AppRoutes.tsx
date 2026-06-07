import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from '../components/auth/AdminRoute'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AuthLayout } from '../components/layout/AuthLayout'
import { MainLayout } from '../components/layout/MainLayout'
import { AdminApprovePage } from '../pages/AdminApprovePage'
import { DashboardPage } from '../pages/DashboardPage'
import { EditSubmissionPage } from '../pages/EditSubmissionPage'
import { LoginPage } from '../pages/LoginPage'
import { MySubmissionsPage } from '../pages/MySubmissionsPage'
import { NewCoinPage } from '../pages/NewCoinPage'
import { ProfilePage } from '../pages/ProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { SubmissionDetailPage } from '../pages/SubmissionDetailPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/new-coin" element={<NewCoinPage />} />
          <Route path="/my-submissions" element={<MySubmissionsPage />} />
          <Route path="/my-submissions/:id/edit" element={<EditSubmissionPage />} />
          <Route path="/my-submissions/:id" element={<SubmissionDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin/approve" element={<AdminApprovePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
