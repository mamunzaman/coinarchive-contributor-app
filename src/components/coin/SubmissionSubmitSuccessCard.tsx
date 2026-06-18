import { useEffect, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { SubmitCoinResponse } from '../../lib/api'
import { StatusBadge } from '../ui/StatusBadge'

const REDIRECT_SECONDS = 5

type SubmissionSubmitSuccessCardProps = {
  result: SubmitCoinResponse
  onSubmitAnother: () => void
}

export function SubmissionSubmitSuccessCard({
  result,
  onSubmitAnother,
}: SubmissionSubmitSuccessCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)
  const cancelledRef = useRef(false)
  const detailPath = `/my-submissions/${result.post_id}`
  const progress = ((REDIRECT_SECONDS - secondsLeft) / REDIRECT_SECONDS) * 100

  const clearRedirect = () => {
    cancelledRef.current = true
  }

  const goToDetail = () => {
    clearRedirect()
    navigate(detailPath)
  }

  const goToDashboard = () => {
    clearRedirect()
    navigate('/dashboard')
  }

  const handleSubmitAnother = () => {
    clearRedirect()
    onSubmitAnother()
    navigate('/new-coin')
  }

  useEffect(() => {
    if (cancelledRef.current) {
      return
    }

    if (secondsLeft <= 0) {
      navigate(detailPath)
      return
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [detailPath, navigate, secondsLeft])

  return (
    <div className="submit-success-card" role="status">
      <div className="submit-success-card__icon-wrap" aria-hidden>
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="submit-success-card__title">{t('wizard.submitSuccessTitle')}</h1>
      <p className="submit-success-card__message">{t('wizard.submitSuccessMessage')}</p>

      <dl className="submit-success-card__meta">
        <div className="submit-success-card__meta-item">
          <dt>{t('common.postId')}</dt>
          <dd className="font-mono">{result.post_id}</dd>
        </div>
        <div className="submit-success-card__meta-item">
          <dt>{t('common.status')}</dt>
          <dd>
            <StatusBadge status={result.status} />
          </dd>
        </div>
      </dl>

      <div className="submit-success-card__countdown" aria-live="polite">
        <p className="submit-success-card__countdown-text">
          {t('wizard.submitRedirectCountdown', { seconds: secondsLeft })}
        </p>
        <div
          className="submit-success-card__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={REDIRECT_SECONDS}
          aria-valuenow={REDIRECT_SECONDS - secondsLeft}
          aria-label={t('wizard.submitRedirectCountdown', { seconds: secondsLeft })}
        >
          <span className="submit-success-card__progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="submit-success-card__actions">
        <button type="button" className="submit-success-card__btn submit-success-card__btn--primary" onClick={goToDetail}>
          {t('wizard.viewSubmission')}
        </button>
        <button
          type="button"
          className="submit-success-card__btn submit-success-card__btn--secondary"
          onClick={goToDashboard}
        >
          {t('wizard.backToDashboard')}
        </button>
        <button
          type="button"
          className="submit-success-card__btn submit-success-card__btn--ghost"
          onClick={handleSubmitAnother}
        >
          {t('wizard.submitAnother')}
        </button>
      </div>
    </div>
  )
}
