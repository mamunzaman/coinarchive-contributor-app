import { lazy } from 'react'

export const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })))
export const RegisterPage = lazy(() => import('../pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))
export const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })))
export const VerifyEmailPage = lazy(() => import('../pages/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage })))
export const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })))

export const DashboardPage = lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
export const MySubmissionsPage = lazy(() => import('../pages/MySubmissionsPage').then((module) => ({ default: module.MySubmissionsPage })))
export const SubmissionDetailPage = lazy(() => import('../pages/SubmissionDetailPage').then((module) => ({ default: module.SubmissionDetailPage })))
export const NewCoinPage = lazy(() => import('../pages/NewCoinPage').then((module) => ({ default: module.NewCoinPage })))
export const EditSubmissionPage = lazy(() => import('../pages/EditSubmissionPage').then((module) => ({ default: module.EditSubmissionPage })))
export const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))

export const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })))
export const AdminSubmissionsPage = lazy(() => import('../pages/admin/AdminSubmissionsPage').then((module) => ({ default: module.AdminSubmissionsPage })))
export const AdminSubmissionDetailPage = lazy(() => import('../pages/admin/AdminSubmissionDetailPage').then((module) => ({ default: module.AdminSubmissionDetailPage })))
export const AdminApprovePage = lazy(() => import('../pages/AdminApprovePage').then((module) => ({ default: module.AdminApprovePage })))
export const AdminImportPage = lazy(() => import('../pages/admin/AdminImportPage').then((module) => ({ default: module.AdminImportPage })))
