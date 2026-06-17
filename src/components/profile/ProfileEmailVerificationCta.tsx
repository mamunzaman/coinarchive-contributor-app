import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { resendAuthVerification } from '../../services/authApi'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type ProfileEmailVerificationCtaProps = {
  email: string
}

export function ProfileEmailVerificationCta({ email }: ProfileEmailVerificationCtaProps) {
  const { t } = useTranslation()
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  async function handleResend() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || isSending) {
      return
    }

    setIsSending(true)
    setMessage(null)
    setIsError(false)

    try {
      await resendAuthVerification({ email: trimmedEmail })
      setMessage(t('profile.verification.sent'))
      setIsError(false)
    } catch {
      setMessage(t('profile.verification.sendFailed'))
      setIsError(true)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="profile-page__verification-card border-amber-200 bg-amber-50/60">
      <h2 className="font-serif text-base font-semibold text-amber-950">
        {t('profile.verification.title')}
      </h2>
      <p className="mt-1 text-sm text-amber-900/90">{t('profile.verification.body')}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="secondary" disabled={isSending} onClick={() => void handleResend()}>
          {isSending ? t('auth.sending') : t('auth.resendVerification')}
        </Button>
        {message ? (
          <p
            role={isError ? 'alert' : 'status'}
            className={['text-sm', isError ? 'text-red-700' : 'text-teal-800'].join(' ')}
          >
            {message}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
