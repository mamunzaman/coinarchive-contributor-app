import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { resendAuthVerification, verifyAuthEmail, toAuthErrorResponse } from '../services/authApi'
import { AUTH_ERROR_CODES, isAuthErrorResponse } from '../types/auth'

type VerifyEmailState =
  | 'invalid_link'
  | 'verifying'
  | 'success'
  | 'token_expired'
  | 'token_invalid'
  | 'error'

type StatusTone = 'success' | 'warning' | 'error' | 'loading'

function StatusIcon({ tone }: { tone: StatusTone }) {
  if (tone === 'loading') {
    return (
      <div className="flex h-14 w-14 items-center justify-center" aria-hidden="true">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    )
  }

  const symbol = tone === 'success' ? '✓' : tone === 'warning' ? '!' : '×'
  const toneClass =
    tone === 'success'
      ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-200'
        : 'bg-red-100 text-red-700 ring-1 ring-red-200'

  return (
    <div
      className={[
        'flex h-14 w-14 items-center justify-center rounded-full',
        toneClass,
      ].join(' ')}
      aria-hidden="true"
    >
      <span className="text-2xl font-semibold">{symbol}</span>
    </div>
  )
}

function VerifyEmailScreen({
  tone,
  title,
  children,
  cta,
  action,
}: {
  tone: StatusTone
  title: string
  children: ReactNode
  cta?: { to: string; label: string }
  action?: ReactNode
}) {
  return (
    <div className="w-full">
      <Card>
        <div className="flex flex-col items-center gap-5 px-1 py-2 text-center sm:px-2">
          <StatusIcon tone={tone} />
          <div className="max-w-sm space-y-2">
            <h1 className="font-serif text-2xl font-semibold text-navy sm:text-[1.65rem]">
              {title}
            </h1>
            <div className="space-y-3 text-sm leading-relaxed text-navy-muted">{children}</div>
          </div>
          {action ? <div className="mt-1 w-full sm:w-auto">{action}</div> : null}
          {cta ? (
            <Link
              to={cta.to}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto sm:min-w-[12rem]"
            >
              {cta.label}
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

function isAlreadyVerifiedMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('already verified') ||
    normalized.includes('already been verified') ||
    normalized.includes('email is already verified')
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
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const latestRequestIdRef = useRef(0)
  const verificationSucceededRef = useRef(false)

  async function handleResendVerification() {
    if (!email) {
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

  useEffect(() => {
    if (!email || !token) {
      setState('invalid_link')
      return
    }

    verificationSucceededRef.current = false
    const requestId = ++latestRequestIdRef.current

    async function verify() {
      if (requestId === latestRequestIdRef.current) {
        setState('verifying')
        setStatusMessage('Please wait while we confirm your email address.')
      }

      try {
        await verifyAuthEmail({ email, token })
        verificationSucceededRef.current = true
        setState('success')
        setStatusMessage(null)
      } catch (error) {
        if (requestId !== latestRequestIdRef.current) {
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
          setStatusMessage('This verification link has expired.')
          return
        }

        if (result.code === AUTH_ERROR_CODES.TOKEN_INVALID) {
          if (
            verificationSucceededRef.current ||
            isAlreadyVerifiedMessage(result.message)
          ) {
            setState('success')
            setStatusMessage(null)
            return
          }

          setState('token_invalid')
          setStatusMessage('This verification link is invalid or has already been used.')
          return
        }

        setState('error')
        setStatusMessage(result.message || 'Unable to verify your email. Please try again later.')
      }
    }

    void verify()
  }, [email, token])

  if (state === 'invalid_link') {
    return (
      <VerifyEmailScreen
        tone="error"
        title="Verification link invalid"
        cta={{ to: '/login', label: 'Go to login' }}
      >
        <p role="alert">
          This verification link is missing required information. Please use the link from your
          email or request a new one.
        </p>
      </VerifyEmailScreen>
    )
  }

  if (state === 'verifying') {
    return (
      <VerifyEmailScreen tone="loading" title="Verifying your email address">
        <p role="status" aria-live="polite">
          {statusMessage ?? 'Please wait while we confirm your email address.'}
        </p>
      </VerifyEmailScreen>
    )
  }

  if (state === 'success') {
    return (
      <VerifyEmailScreen
        tone="success"
        title="Email verified successfully"
        cta={{ to: '/login', label: 'Go to login' }}
      >
        <p role="status" aria-live="polite">
          Your account is now awaiting admin approval.
        </p>
      </VerifyEmailScreen>
    )
  }

  if (state === 'token_expired') {
    return (
      <VerifyEmailScreen
        tone="warning"
        title="Link expired"
        cta={{ to: '/login', label: 'Go to login' }}
        action={
          email ? (
            <div className="flex w-full flex-col gap-2 sm:min-w-[12rem]">
              <Button
                type="button"
                variant="secondary"
                className="w-full !min-h-11"
                disabled={isResending}
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
          ) : undefined
        }
      >
        <p role="alert" aria-live="polite">
          {statusMessage}
        </p>
        <p>Request a new verification email, or sign in if you already verified your account.</p>
      </VerifyEmailScreen>
    )
  }

  if (state === 'token_invalid') {
    return (
      <VerifyEmailScreen
        tone="error"
        title="Link invalid"
        cta={{ to: '/login', label: 'Go to login' }}
      >
        <p role="alert" aria-live="polite">
          {statusMessage}
        </p>
      </VerifyEmailScreen>
    )
  }

  return (
    <VerifyEmailScreen
      tone="error"
      title="Verification failed"
      cta={{ to: '/login', label: 'Go to login' }}
    >
      <p role="alert" aria-live="polite">
        {statusMessage}
      </p>
    </VerifyEmailScreen>
  )
}
