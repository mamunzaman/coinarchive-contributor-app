import { Suspense, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminRoute } from '../components/auth/AdminRoute'
import { GuestRoute } from '../components/auth/GuestRoute'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AuthLayout } from '../components/layout/AuthLayout'
import { MainLayout } from '../components/layout/MainLayout'
import { UnsavedChangesLayout } from '../components/layout/UnsavedChangesLayout'
import { CoinWizardErrorBoundary } from '../components/coin/CoinWizardErrorBoundary'
import { RouteErrorFallback } from '../components/routing/RouteErrorFallback'
import {
  AdminApprovePage,
  AdminDashboardPage,
  AdminImportPage,
  AdminSubmissionDetailPage,
  AdminSubmissionsPage,
  DashboardPage,
  EditSubmissionPage,
  ForgotPasswordPage,
  LoginPage,
  MySubmissionsPage,
  NewCoinPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  SubmissionDetailPage,
  VerifyEmailPage,
} from './lazyPages'
import { RouteLoadingSkeleton } from './RouteLoadingSkeleton'

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '')

function routeElement(Component: ComponentType): ReactNode {
  return (
    <Suspense fallback={<RouteLoadingSkeleton />}>
      <Component />
    </Suspense>
  )
}

function coinWizardRouteElement(Component: ComponentType): ReactNode {
  return (
    <Suspense fallback={<RouteLoadingSkeleton />}>
      <CoinWizardErrorBoundary>
        <Component />
      </CoinWizardErrorBoundary>
    </Suspense>
  )
}

export const appRouter = createBrowserRouter(
  [
    {
      errorElement: <RouteErrorFallback />,
      element: <AuthLayout />,
      children: [
        {
          element: <GuestRoute />,
          children: [
            { path: '/login', element: routeElement(LoginPage) },
            { path: '/register', element: routeElement(RegisterPage) },
            { path: '/forgot-password', element: routeElement(ForgotPasswordPage) },
          ],
        },
        {
          element: <GuestRoute allowWhenAuthenticated />,
          children: [
            { path: '/verify-email', element: routeElement(VerifyEmailPage) },
            { path: '/reset-password', element: routeElement(ResetPasswordPage) },
          ],
        },
      ],
    },
    {
      errorElement: <RouteErrorFallback />,
      element: <ProtectedRoute />,
      children: [
        {
          element: <UnsavedChangesLayout />,
          children: [
            {
              element: <MainLayout />,
              children: [
                { path: '/dashboard', element: routeElement(DashboardPage) },
                { path: '/new-coin', element: coinWizardRouteElement(NewCoinPage) },
                { path: '/my-submissions', element: routeElement(MySubmissionsPage) },
                { path: '/my-submissions/:id/edit', element: coinWizardRouteElement(EditSubmissionPage) },
                { path: '/my-submissions/:id', element: routeElement(SubmissionDetailPage) },
                { path: '/profile', element: routeElement(ProfilePage) },
                {
                  element: <AdminRoute />,
                  children: [
                    { path: '/admin', element: routeElement(AdminDashboardPage) },
                    { path: '/admin/submissions', element: routeElement(AdminSubmissionsPage) },
                    { path: '/admin/submissions/:id', element: routeElement(AdminSubmissionDetailPage) },
                    { path: '/admin/approve', element: routeElement(AdminApprovePage) },
                    { path: '/admin/import', element: routeElement(AdminImportPage) },
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
  ],
  { basename: routerBasename },
)
