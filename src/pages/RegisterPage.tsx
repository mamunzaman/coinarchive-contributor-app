import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { clearAuthSession } from '../lib/auth'
import { clearAuthSessionStorage } from '../lib/authSessionStorage'
import { registerAuthUser, toAuthErrorResponse } from '../services/authApi'
import {
  AUTH_ERROR_CODES,
  isAuthErrorResponse,
  type AuthErrorResponse,
} from '../types/auth'
import {
  validateRegisterForm,
  type RegisterFieldErrors,
  type RegisterFormValues,
} from '../lib/validation'

const initialValues: RegisterFormValues = {
  display_name: '',
  email: '',
  password: '',
}

const REGISTER_API_ERROR_ID = 'register-api-error'

type RegisterVerificationHint = {
  email: string
  canResendVerification?: boolean
}

function resolveRegisterErrorMessage(result: AuthErrorResponse): string {
  if (result.code === AUTH_ERROR_CODES.RATE_LIMITED) {
    return 'Too many registration attempts. Please try again later.'
  }

  if (
    result.status === 409 ||
    result.code === 'EMAIL_EXISTS' ||
    result.code === 'EMAIL_ALREADY_REGISTERED' ||
    result.code === 'rest_email_exists' ||
    result.code === 'DUPLICATE_EMAIL'
  ) {
    return 'If this email is already registered, please log in or reset your password.'
  }

  return result.message || 'Registration failed. Please try again.'
}

export function RegisterPage() {
  const [values, setValues] = useState<RegisterFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [devVerificationToken, setDevVerificationToken] = useState<string | null>(null)
  const [verificationHint, setVerificationHint] = useState<RegisterVerificationHint | null>(null)

  const verificationUrl =
    devVerificationToken && import.meta.env.VITE_API_BASE_URL
      ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/verify-email?token=${devVerificationToken}`
      : null

  function updateField(field: keyof RegisterFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setApiError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateRegisterForm(values)
    setFieldErrors(errors)
    setApiError(null)

    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await registerAuthUser({
        display_name: values.display_name.trim(),
        email: values.email.trim(),
        password: values.password,
      })

      setValues({ ...initialValues, password: '' })
      clearAuthSession()
      clearAuthSessionStorage()
      setVerificationHint({
        email: response.email ?? values.email.trim(),
        canResendVerification: response.canResendVerification,
      })
      setDevVerificationToken(response.dev_verification_token ?? null)
      setIsSuccess(true)
    } catch (error) {
      const result = toAuthErrorResponse(error)
      if (isAuthErrorResponse(result)) {
        setApiError(resolveRegisterErrorMessage(result))
      } else {
        setApiError('Unable to reach the server. Check your connection and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formErrorDescribedBy = apiError ? REGISTER_API_ERROR_ID : undefined

  if (isSuccess) {
    return (
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">
            Account created
          </h1>
        </div>

        <Card>
          <div className="flex flex-col gap-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl text-primary" aria-hidden="true">
                ✓
              </span>
            </div>
            <p className="text-sm leading-relaxed text-navy-muted" role="status">
              Account created. Please check your email to verify your account.
            </p>
            {verificationHint?.email ? (
              <p className="text-sm leading-relaxed text-navy-muted">
                Verification instructions were sent to{' '}
                <strong className="font-medium text-navy">{verificationHint.email}</strong>.
              </p>
            ) : null}
            <p className="text-sm leading-relaxed text-navy-muted">
              After verification, your account will show pending approval until an admin approves
              it.
            </p>

            {import.meta.env.DEV && devVerificationToken ? (
              <div className="rounded-xl border border-dashed border-navy/15 bg-muted px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-muted">
                  Developer only
                </p>
                <p className="mt-2 break-all font-mono text-xs text-navy">
                  {devVerificationToken}
                </p>
                {verificationUrl ? (
                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    Open verification link
                  </a>
                ) : null}
              </div>
            ) : null}

            <ol className="space-y-2 text-left text-sm text-navy-muted">
              <li>
                <span className="font-medium text-navy">Step 1:</span> Open the verification link
                and confirm your email.
              </li>
              <li>
                <span className="font-medium text-navy">Step 2:</span> Ask an admin to approve your
                account.
              </li>
              <li>
                <span className="font-medium text-navy">Step 3:</span> Sign in after approval.
              </li>
            </ol>

            <Link
              to="/login"
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Continue to sign in
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-navy-muted">
          Join CoinArchive as a contributor and start cataloguing coins.
        </p>
      </div>

      <Card>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          {apiError ? (
            <div
              id={REGISTER_API_ERROR_ID}
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {apiError}
            </div>
          ) : null}

          <TextField
            label="Display name"
            name="display_name"
            autoComplete="name"
            placeholder="Jane Collector"
            value={values.display_name}
            onChange={(event) => updateField('display_name', event.target.value)}
            error={fieldErrors.display_name}
            disabled={isSubmitting}
            aria-describedby={formErrorDescribedBy}
            required
          />
          <TextField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            error={fieldErrors.email}
            disabled={isSubmitting}
            aria-describedby={formErrorDescribedBy}
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
            error={fieldErrors.password}
            disabled={isSubmitting}
            aria-describedby={formErrorDescribedBy}
            required
          />

          <Button type="submit" fullWidth className="mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-navy-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
          Sign in
        </Link>
      </p>
    </div>
  )
}
