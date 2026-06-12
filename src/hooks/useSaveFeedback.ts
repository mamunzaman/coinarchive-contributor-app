import { useCallback, useEffect, useRef, useState } from 'react'

type InlineFeedback = {
  variant: 'success' | 'error'
  message: string
} | null

const INLINE_DISMISS_MS = 6000
const INLINE_FADE_MS = 200

export function useSaveFeedback() {
  const inlineRef = useRef<HTMLDivElement>(null)
  const inlineTimerRef = useRef<number | null>(null)
  const [inlineFeedback, setInlineFeedback] = useState<InlineFeedback>(null)
  const [inlineExiting, setInlineExiting] = useState(false)
  const [toast, setToast] = useState<InlineFeedback>(null)

  const clearInlineTimer = useCallback(() => {
    if (inlineTimerRef.current !== null) {
      window.clearTimeout(inlineTimerRef.current)
      inlineTimerRef.current = null
    }
  }, [])

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  const revealInlineFeedback = useCallback(() => {
    requestAnimationFrame(() => {
      const node = inlineRef.current
      if (!node) {
        return
      }

      const rect = node.getBoundingClientRect()
      const isFullyVisible =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth

      if (!isFullyVisible) {
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }

      node.focus({ preventScroll: true })
    })
  }, [])

  const dismissInlineFeedback = useCallback(() => {
    setInlineExiting(true)
    inlineTimerRef.current = window.setTimeout(() => {
      setInlineFeedback(null)
      setInlineExiting(false)
      inlineTimerRef.current = null
    }, INLINE_FADE_MS)
  }, [])

  const clearInlineFeedback = useCallback(() => {
    clearInlineTimer()
    setInlineExiting(false)
    setInlineFeedback(null)
  }, [clearInlineTimer])

  const showSuccess = useCallback(
    (message: string) => {
      clearInlineTimer()
      setInlineExiting(false)
      setInlineFeedback({ variant: 'success', message })
      setToast({ variant: 'success', message })
      revealInlineFeedback()

      inlineTimerRef.current = window.setTimeout(() => {
        dismissInlineFeedback()
      }, INLINE_DISMISS_MS)
    },
    [clearInlineTimer, dismissInlineFeedback, revealInlineFeedback],
  )

  const showError = useCallback(
    (message: string) => {
      clearInlineTimer()
      setInlineExiting(false)
      setInlineFeedback({ variant: 'error', message })
      setToast({ variant: 'error', message })
      revealInlineFeedback()
    },
    [clearInlineTimer, revealInlineFeedback],
  )

  useEffect(() => clearInlineTimer, [clearInlineTimer])

  return {
    inlineRef,
    inlineFeedback,
    inlineExiting,
    toast,
    showSuccess,
    showError,
    dismissToast,
    clearInlineFeedback,
  }
}
