import { X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '../ui/StatusBadge'

export type SubmissionFeedbackPopoverType = 'needs_revision' | 'rejected' | 'info'

type SubmissionFeedbackPopoverProps = {
  status: string
  type: SubmissionFeedbackPopoverType
  title: string
  intro: string
  message?: string
  actionLabel?: string
  actionHref?: string
  triggerLabel: string
}

function getToneClass(type: SubmissionFeedbackPopoverType): string {
  if (type === 'needs_revision') {
    return 'submission-feedback-modal--revision'
  }

  if (type === 'rejected') {
    return 'submission-feedback-modal--rejected'
  }

  return 'submission-feedback-modal--info'
}

export function SubmissionFeedbackPopover({
  status,
  type,
  title,
  intro,
  message,
  actionLabel,
  actionHref,
  triggerLabel,
}: SubmissionFeedbackPopoverProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const close = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => closeRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [close, open])

  const toneClass = getToneClass(type)

  const modal =
    open &&
    createPortal(
      <>
        <button
          type="button"
          className="submission-feedback-modal__backdrop"
          aria-label={t('common.closeFeedbackDialog')}
          onClick={close}
        />
        <div className="submission-feedback-modal__viewport" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={['submission-feedback-modal', toneClass].join(' ')}
          >
            <div className="submission-feedback-modal__header">
              <h2 id={titleId} className="submission-feedback-modal__title">
                {title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                className="submission-feedback-modal__close"
                aria-label={t('common.closeFeedbackDialog')}
                onClick={close}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="submission-feedback-modal__body">
              <p className="submission-feedback-modal__intro">{intro}</p>
              {message ? (
                <div className="submission-feedback-modal__feedback">
                  <p className="submission-feedback-modal__feedback-label">
                    {t('detail.adminFeedback')}
                  </p>
                  <p className="submission-feedback-modal__feedback-text">{message}</p>
                </div>
              ) : null}
              {actionLabel && actionHref ? (
                <Link to={actionHref} className="submission-feedback-modal__action" onClick={close}>
                  {actionLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </>,
      document.body,
    )

  return (
    <>
      <StatusBadge
        status={status}
        interactive
        buttonRef={triggerRef}
        ariaLabel={triggerLabel}
        ariaExpanded={open}
        onClick={() => setOpen(true)}
      />
      {modal}
    </>
  )
}
