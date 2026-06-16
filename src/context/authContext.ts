import { createContext } from 'react'
import type {
  AuthContributor,
  AuthErrorResponse,
  AuthLoginResult,
  AuthLoginSuccess,
} from '../types/auth'

export type AuthContextValue = {
  user: AuthContributor | null
  token: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<AuthLoginResult>
  loginWithCredentials: (email: string, password: string) => Promise<AuthLoginResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthContributor | AuthErrorResponse>
  setSession: (response: AuthLoginSuccess) => void
  setSessionFromLoginResponse: (response: AuthLoginSuccess) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
