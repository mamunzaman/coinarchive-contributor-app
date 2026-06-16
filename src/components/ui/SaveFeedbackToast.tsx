import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { runAfterCommit } from '../../lib/runAfterCommit'

export type SaveFeedbackToastState = {
  variant: 'success' | 'error'
  message: string
} | null

type SaveFeedbackToastProps = {
  toast: SaveFeedbackToastState
  onDismiss: () => void
  autoDismissMs?: number
}

export function SaveFeedbackToast({
  toast,
  onDismiss,
  autoDismissMs = 4500,
}: SaveFeedbackToastProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!toast) {
      runAfterCommit(() => {
        setVisible(false)
        setExiting(false)
      })
      return
    }

    runAfterCommit(() => {
      setMounted(true)
      setExiting(false)
      setVisible(false)
    })
    const enterFrame = requestAnimationFrame(() => setVisible(true))

    const dismissTimer = window.setTimeout(() => {
      setExiting(true)
      setVisible(false)
    }, autoDismissMs)

    const unmountTimer = window.setTimeout(() => {
      onDismiss()
      setMounted(false)
      setExiting(false)
    }, autoDismissMs + 200)

    return () => {
      cancelAnimationFrame(enterFrame)
      window.clearTimeout(dismissTimer)
      window.clearTimeout(unmountTimer)
    }
  }, [autoDismissMs, onDismiss, toast])

  function dismissToast() {
    setExiting(true)
    setVisible(false)
    window.setTimeout(onDismiss, 200)
  }

  if (!toast || !mounted) {
    return null
  }

  const isSuccess = toast.variant === 'success'

  const motionClass = visible
    ? 'save-feedback-toast--visible'
    : exiting
      ? 'save-feedback-toast--exiting'
      : 'save-feedback-toast--enter-from'

  return createPortal(
    <div
      className={[
        'save-feedback-toast',
        motionClass,
        isSuccess ? 'save-feedback-toast--success' : 'save-feedback-toast--error',
      ].join(' ')}
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
    >
      <span className="save-feedback-toast__icon-wrap" aria-hidden>
        {isSuccess ? (
          <Check className="save-feedback-toast__icon" strokeWidth={2.75} />
        ) : (
          <AlertCircle className="save-feedback-toast__icon" strokeWidth={2.75} />
        )}
      </span>
      <p className="save-feedback-toast__message">{toast.message}</p>
      <button
        type="button"
        className="save-feedback-toast__close"
        aria-label={t('common.closeHelp')}
        onClick={dismissToast}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>,
    document.body,
  )
}
