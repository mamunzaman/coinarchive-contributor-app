import { forwardRef } from 'react'
import { AlertCircle, Check } from 'lucide-react'

type SaveFeedbackBannerProps = {
  variant: 'success' | 'error'
  message: string
  exiting?: boolean
}

export const SaveFeedbackBanner = forwardRef<HTMLDivElement, SaveFeedbackBannerProps>(
  function SaveFeedbackBanner({ variant, message, exiting = false }, ref) {
    const isSuccess = variant === 'success'

    return (
      <div
        ref={ref}
        tabIndex={-1}
        role={isSuccess ? 'status' : 'alert'}
        aria-live={isSuccess ? 'polite' : 'assertive'}
        className={[
          'save-feedback-banner',
          isSuccess ? 'save-feedback-banner--success' : 'save-feedback-banner--error',
          exiting ? 'save-feedback-banner--exiting' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isSuccess ? (
          <Check className="save-feedback-banner__icon" aria-hidden />
        ) : (
          <AlertCircle className="save-feedback-banner__icon" aria-hidden />
        )}
        <p className="save-feedback-banner__message">{message}</p>
      </div>
    )
  },
)
