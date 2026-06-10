import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../hooks/useAuth'
import { resendAuthVerification, toAuthErrorResponse } from '../services/authApi'
import {
  AUTH_ERROR_CODES,
  isAuthErrorResponse,
  type AuthErrorCode,
  type AuthErrorResponse,
} from '../types/auth'
import {
  validateLoginForm,
  type LoginFieldErrors,
  type LoginFormValues,
} from '../lib/validation'

const initialValues: LoginFormValues = {
  email: '',
  password: '',
}

const LOGIN_API_ERROR_ID = 'login-api-error'

type VerificationHint = {
  email?: string
  canResendVerification?: boolean
}

function resolveLoginDestination(role?: string, status?: string): string {
  return role === 'admin' && status === 'approved' ? '/admin' : '/dashboard'
}

function resolveLoginErrorMessage(result: AuthErrorResponse): string {
  switch (result.code) {
    case AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED:
      return 'Please verify your email before logging in.'
    case AUTH_ERROR_CODES.PENDING_APPROVAL:
      return 'Your account is verified and awaiting admin approval.'
    case AUTH_ERROR_CODES.RATE_LIMITED:
      return 'Too many attempts. Please try again later.'
    default:
      break
  }

  if (
    result.status === 401 ||
    result.code === 'rest_invalid_credentials' ||
    result.code === 'INVALID_CREDENTIALS'
  ) {
    return 'Invalid email or password.'
  }

  return result.message || 'Unable to sign in. Please try again.'
}

function isWarningLoginError(code: AuthErrorCode): boolean {
  return code === AUTH_ERROR_CODES.PENDING_APPROVAL
}

function canShowResendVerification(
  errorCode: AuthErrorCode | null,
  hint: VerificationHint | null,
): boolean {
  if (errorCode !== AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED || !hint?.email?.trim()) {
    return false
  }

  return hint.canResendVerification !== false
}

export function LoginPage() {
  const navigate = useNavigate()
  const { loginWithCredentials, isAuthenticated, isBootstrapping, user } = useAuth()
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiErrorCode, setApiErrorCode] = useState<AuthErrorCode | null>(null)
  const [verificationHint, setVerificationHint] = useState<VerificationHint | null>(null)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated || !user) {
      return
    }

    navigate(resolveLoginDestination(user.role, user.status), { replace: true })
  }, [isAuthenticated, isBootstrapping, navigate, user])

  function updateField(field: keyof LoginFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setApiError(null)
    setApiErrorCode(null)
    setVerificationHint(null)
    setResendMessage(null)
  }

  async function handleResendVerification() {
    const email = verificationHint?.email?.trim()
    if (!email || !canShowResendVerification(apiErrorCode, verificationHint)) {
      return
    }

    setIsResending(true)
    setResendMessage(null)

    try {
      await resendAuthVerification({ email })
      setResendMessage('Verification email sent. Please check your inbox.')
    } catch (error) {
      const result = toAuthErrorResponse(error)
      if (isAuthErrorResponse(result) && result.code === AUTH_ERROR_CODES.RATE_LIMITED) {
        setResendMessage('Please wait before requesting another verification email.')
      } else {
        setResendMessage('Could not resend verification email. Please try again.')
      }
    } finally {
      setIsResending(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateLoginForm(values)
    setFieldErrors(errors)
    setApiError(null)
    setApiErrorCode(null)
    setVerificationHint(null)
    setResendMessage(null)

    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)

    const result = await loginWithCredentials(values.email.trim(), values.password)

    if (!isAuthErrorResponse(result)) {
      navigate(
        resolveLoginDestination(result.contributor.role, result.contributor.status),
        { replace: true },
      )
      setIsSubmitting(false)
      return
    }

    setApiError(resolveLoginErrorMessage(result))
    setApiErrorCode(result.code)

    if (result.code === AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED) {
      setVerificationHint({
        email: result.email ?? values.email.trim(),
        canResendVerification: result.canResendVerification,
      })
    }

    setIsSubmitting(false)
  }

  const showWarningAlert = apiErrorCode ? isWarningLoginError(apiErrorCode) : false
  const showResendVerification = canShowResendVerification(apiErrorCode, verificationHint)
  const formErrorDescribedBy = apiError ? LOGIN_API_ERROR_ID : undefined

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-navy-muted">
          Sign in to manage your coin submissions.
        </p>
      </div>

      <Card>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          {apiError ? (
            <div
              id={LOGIN_API_ERROR_ID}
              role="alert"
              aria-live="polite"
              className={[
                'rounded-xl px-4 py-3 text-sm',
                showWarningAlert
                  ? 'border border-amber-200 bg-amber-50 text-amber-900'
                  : 'border border-red-200 bg-red-50 text-red-700',
              ].join(' ')}
            >
              <p>{apiError}</p>
              {showResendVerification ? (
                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full !min-h-10"
                    disabled={isResending || isSubmitting || isBootstrapping}
                    onClick={() => void handleResendVerification()}
                  >
                    {isResending ? 'Sending…' : 'Resend verification email'}
                  </Button>
                  {resendMessage ? (
                    <p
                      role="status"
                      aria-live="polite"
                      className={[
                        'text-xs leading-relaxed',
                        resendMessage.startsWith('Verification email sent')
                          ? 'text-emerald-800'
                          : 'text-red-700',
                      ].join(' ')}
                    >
                      {resendMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {apiErrorCode === AUTH_ERROR_CODES.PENDING_APPROVAL && import.meta.env.DEV ? (
                <Link
                  to="/admin/approve"
                  className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  Local admin approval tool
                </Link>
              ) : null}
            </div>
          ) : null}

          <TextField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            error={fieldErrors.email}
            disabled={isSubmitting || isBootstrapping}
            aria-describedby={formErrorDescribedBy}
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
            error={fieldErrors.password}
            disabled={isSubmitting || isBootstrapping}
            aria-describedby={formErrorDescribedBy}
            required
          />

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth disabled={isSubmitting || isBootstrapping}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-navy-muted">
        New contributor?{' '}
        <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
          Create an account
        </Link>
      </p>
    </div>
  )
}
