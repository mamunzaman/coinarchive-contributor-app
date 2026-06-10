import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { resetAuthPassword, toAuthErrorResponse } from '../services/authApi'
import { AUTH_ERROR_CODES, isAuthErrorResponse } from '../types/auth'

const RESET_PASSWORD_API_ERROR_ID = 'reset-password-api-error'

type ResetPasswordFieldErrors = {
  password?: string
  confirmPassword?: string
}

function validateResetPasswordForm(password: string, confirmPassword: string): ResetPasswordFieldErrors {
  const errors: ResetPasswordFieldErrors = {}

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

function ResetPasswordStatusCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">{title}</h1>
      </div>
      <Card>
        <div className="flex flex-col gap-4 text-center">{children}</div>
      </Card>
    </div>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')?.trim() ?? ''
  const token = searchParams.get('token')?.trim() ?? ''
  const hasValidLink = Boolean(email && token)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const formDescribedBy = apiError ? RESET_PASSWORD_API_ERROR_ID : undefined

  if (!hasValidLink) {
    return (
      <ResetPasswordStatusCard title="Reset link invalid">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
          <span className="text-xl" aria-hidden="true">
            ×
          </span>
        </div>
        <p className="text-sm leading-relaxed text-navy-muted" role="alert">
          This password reset link is missing required information. Please request a new reset
          email.
        </p>
        <Link
          to="/forgot-password"
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Request reset link
        </Link>
      </ResetPasswordStatusCard>
    )
  }

  if (isSuccess) {
    return (
      <ResetPasswordStatusCard title="Password updated">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <span className="text-xl text-primary" aria-hidden="true">
            ✓
          </span>
        </div>
        <p className="text-sm leading-relaxed text-navy-muted" role="status" aria-live="polite">
          Password updated successfully. You can now log in.
        </p>
        <Link
          to="/login"
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Go to login
        </Link>
      </ResetPasswordStatusCard>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateResetPasswordForm(password, confirmPassword)
    setFieldErrors(errors)
    setApiError(null)

    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await resetAuthPassword({ email, token, password })
      setIsSuccess(true)
    } catch (error) {
      const result = toAuthErrorResponse(error)
      if (isAuthErrorResponse(result) && result.code === AUTH_ERROR_CODES.TOKEN_EXPIRED) {
        setApiError('Reset link expired.')
      } else if (isAuthErrorResponse(result) && result.code === AUTH_ERROR_CODES.TOKEN_INVALID) {
        setApiError('Reset link is invalid.')
      } else {
        setApiError(result.message || 'Unable to reset password. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-navy-muted">Set a new password for your account.</p>
      </div>

      <Card>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          {apiError ? (
            <div
              id={RESET_PASSWORD_API_ERROR_ID}
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {apiError}
            </div>
          ) : null}

          <TextField
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setFieldErrors((current) => ({ ...current, password: undefined }))
              setApiError(null)
            }}
            error={fieldErrors.password}
            disabled={isSubmitting}
            aria-describedby={formDescribedBy}
            required
          />
          <TextField
            label="Confirm password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value)
              setFieldErrors((current) => ({ ...current, confirmPassword: undefined }))
              setApiError(null)
            }}
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting}
            aria-describedby={formDescribedBy}
            required
          />

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-navy-muted">
        <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
