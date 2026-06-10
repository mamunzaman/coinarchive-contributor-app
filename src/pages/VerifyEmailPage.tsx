import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { verifyAuthEmail, toAuthErrorResponse } from '../services/authApi'
import { AUTH_ERROR_CODES, isAuthErrorResponse } from '../types/auth'

type VerifyEmailState =
  | 'invalid_link'
  | 'verifying'
  | 'success'
  | 'token_expired'
  | 'token_invalid'
  | 'error'

function StatusIcon({ tone }: { tone: 'success' | 'warning' | 'error' | 'loading' }) {
  if (tone === 'loading') {
    return (
      <span
        className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
        aria-hidden="true"
      />
    )
  }

  const symbol = tone === 'success' ? '✓' : tone === 'warning' ? '!' : '×'
  const toneClass =
    tone === 'success'
      ? 'bg-primary/10 text-primary'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-red-100 text-red-700'

  return (
    <div
      className={[
        'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
        toneClass,
      ].join(' ')}
    >
      <span className="text-xl" aria-hidden="true">
        {symbol}
      </span>
    </div>
  )
}

function VerifyEmailStatusCard({
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

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')?.trim() ?? ''
  const token = searchParams.get('token')?.trim() ?? ''
  const [state, setState] = useState<VerifyEmailState>(() =>
    email && token ? 'verifying' : 'invalid_link',
  )
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const verifyAttemptedRef = useRef(false)

  useEffect(() => {
    if (!email || !token) {
      setState('invalid_link')
      return
    }

    if (verifyAttemptedRef.current) {
      return
    }

    verifyAttemptedRef.current = true
    let cancelled = false

    async function verify() {
      setState('verifying')
      setStatusMessage('Verifying your email address…')

      try {
        await verifyAuthEmail({ email, token })
        if (cancelled) {
          return
        }

        setState('success')
        setStatusMessage('Email verified successfully.')
      } catch (error) {
        if (cancelled) {
          return
        }

        const result = toAuthErrorResponse(error)
        if (!isAuthErrorResponse(result)) {
          setState('error')
          setStatusMessage('Unable to verify your email. Please try again later.')
          return
        }

        if (result.code === AUTH_ERROR_CODES.TOKEN_EXPIRED) {
          setState('token_expired')
          setStatusMessage('Verification link expired.')
          return
        }

        if (result.code === AUTH_ERROR_CODES.TOKEN_INVALID) {
          setState('token_invalid')
          setStatusMessage('Verification link is invalid.')
          return
        }

        setState('error')
        setStatusMessage(result.message || 'Unable to verify your email. Please try again later.')
      }
    }

    void verify()

    return () => {
      cancelled = true
    }
  }, [email, token])

  if (state === 'invalid_link') {
    return (
      <VerifyEmailStatusCard title="Verification link invalid">
        <StatusIcon tone="error" />
        <p className="text-sm leading-relaxed text-navy-muted" role="alert">
          This verification link is missing required information. Please use the link from your
          email or request a new one.
        </p>
        <Link
          to="/login"
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Go to login
        </Link>
      </VerifyEmailStatusCard>
    )
  }

  if (state === 'verifying') {
    return (
      <VerifyEmailStatusCard title="Verifying email">
        <StatusIcon tone="loading" />
        <p className="text-sm leading-relaxed text-navy-muted" role="status" aria-live="polite">
          {statusMessage}
        </p>
      </VerifyEmailStatusCard>
    )
  }

  if (state === 'success') {
    return (
      <VerifyEmailStatusCard title="Email verified">
        <StatusIcon tone="success" />
        <p className="text-sm leading-relaxed text-navy-muted" role="status" aria-live="polite">
          {statusMessage}
        </p>
        <p className="text-sm leading-relaxed text-navy-muted">
          Your account is now awaiting admin approval.
        </p>
        <Link
          to="/login"
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Go to login
        </Link>
      </VerifyEmailStatusCard>
    )
  }

  if (state === 'token_expired') {
    return (
      <VerifyEmailStatusCard title="Link expired">
        <StatusIcon tone="warning" />
        <p className="text-sm leading-relaxed text-navy-muted" role="alert" aria-live="polite">
          {statusMessage}
        </p>
        <p className="text-sm leading-relaxed text-navy-muted">
          Sign in to request a new verification email when resend is available.
        </p>
        <Link
          to="/login"
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Go to login
        </Link>
      </VerifyEmailStatusCard>
    )
  }

  if (state === 'token_invalid') {
    return (
      <VerifyEmailStatusCard title="Link invalid">
        <StatusIcon tone="error" />
        <p className="text-sm leading-relaxed text-navy-muted" role="alert" aria-live="polite">
          {statusMessage}
        </p>
        <Link
          to="/login"
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Go to login
        </Link>
      </VerifyEmailStatusCard>
    )
  }

  return (
    <VerifyEmailStatusCard title="Verification failed">
      <StatusIcon tone="error" />
      <p className="text-sm leading-relaxed text-navy-muted" role="alert" aria-live="polite">
        {statusMessage}
      </p>
      <Link
        to="/login"
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Go to login
      </Link>
    </VerifyEmailStatusCard>
  )
}
