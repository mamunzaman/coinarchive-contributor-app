import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminRoute } from '../components/auth/AdminRoute'
import { GuestRoute } from '../components/auth/GuestRoute'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AuthLayout } from '../components/layout/AuthLayout'
import { MainLayout } from '../components/layout/MainLayout'
import { UnsavedChangesLayout } from '../components/layout/UnsavedChangesLayout'
import { AdminApprovePage } from '../pages/AdminApprovePage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminImportPage } from '../pages/admin/AdminImportPage'
import { AdminSubmissionDetailPage } from '../pages/admin/AdminSubmissionDetailPage'
import { AdminSubmissionsPage } from '../pages/admin/AdminSubmissionsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { EditSubmissionPage } from '../pages/EditSubmissionPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { LoginPage } from '../pages/LoginPage'
import { MySubmissionsPage } from '../pages/MySubmissionsPage'
import { NewCoinPage } from '../pages/NewCoinPage'
import { ProfilePage } from '../pages/ProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { VerifyEmailPage } from '../pages/VerifyEmailPage'
import { SubmissionDetailPage } from '../pages/SubmissionDetailPage'

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '')

export const appRouter = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      {
        element: <GuestRoute allowWhenAuthenticated />,
        children: [
          { path: '/verify-email', element: <VerifyEmailPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <UnsavedChangesLayout />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/new-coin', element: <NewCoinPage /> },
              { path: '/my-submissions', element: <MySubmissionsPage /> },
              { path: '/my-submissions/:id/edit', element: <EditSubmissionPage /> },
              { path: '/my-submissions/:id', element: <SubmissionDetailPage /> },
              { path: '/profile', element: <ProfilePage /> },
              {
                element: <AdminRoute />,
                children: [
                  { path: '/admin', element: <AdminDashboardPage /> },
                  { path: '/admin/submissions', element: <AdminSubmissionsPage /> },
                  { path: '/admin/submissions/:id', element: <AdminSubmissionDetailPage /> },
                  { path: '/admin/approve', element: <AdminApprovePage /> },
                  { path: '/admin/import', element: <AdminImportPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
], { basename: routerBasename })
