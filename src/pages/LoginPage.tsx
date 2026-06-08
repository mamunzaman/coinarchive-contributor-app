import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { ApiError, loginContributor } from '../lib/api'
import { clearStaleAuthSession, getDefaultAppPath, isApprovedSession, saveAuthSession } from '../lib/auth'
import {
  validateLoginForm,
  type LoginFieldErrors,
  type LoginFormValues,
} from '../lib/validation'

const initialValues: LoginFormValues = {
  email: '',
  password: '',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiErrorCode, setApiErrorCode] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    clearStaleAuthSession()

    if (isApprovedSession()) {
      navigate(getDefaultAppPath(), { replace: true })
    }
  }, [navigate])

  function updateField(field: keyof LoginFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setApiError(null)
    setApiErrorCode(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateLoginForm(values)
    setFieldErrors(errors)
    setApiError(null)
    setApiErrorCode(null)

    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await loginContributor({
        email: values.email.trim(),
        password: values.password,
      })

      saveAuthSession(response.token, response.contributor)
      const destination =
        response.contributor.role === 'admin' && response.contributor.status === 'approved'
          ? '/admin'
          : '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message)
        setApiErrorCode(error.code ?? null)
      } else {
        setApiError('Unable to reach the server. Check your connection and try again.')
        setApiErrorCode(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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
              role="alert"
              className={[
                'rounded-xl px-4 py-3 text-sm',
                apiErrorCode === 'rest_contributor_not_approved'
                  ? 'border border-amber-200 bg-amber-50 text-amber-900'
                  : 'border border-red-200 bg-red-50 text-red-700',
              ].join(' ')}
            >
              <p>
                {apiErrorCode === 'rest_contributor_not_approved'
                  ? 'Your email is verified, but your account is waiting for admin approval. Please contact the site owner.'
                  : apiError}
              </p>
              {apiErrorCode === 'rest_contributor_not_approved' && import.meta.env.DEV ? (
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            required
          />

          <div className="flex items-center justify-end">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" fullWidth disabled={isSubmitting}>
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
