import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useBlocker, useNavigate, type NavigateOptions } from 'react-router-dom'
import { LeaveConfirmDialog } from '../components/ui/LeaveConfirmDialog'
import { UnsavedChangesContext } from '../context/unsavedChangesContext'
import { runAfterCommit } from '../lib/runAfterCommit'

type PendingNavigation = {
  to: string
  options?: NavigateOptions
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const isDirtyRef = useRef(false)
  const [isDirty, setIsDirtyState] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const pendingNavigationRef = useRef<PendingNavigation | null>(null)

  const setDirty = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty
    setIsDirtyState(dirty)
  }, [])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      runAfterCommit(() => {
        setDialogOpen(true)
      })
    }
  }, [blocker.state])

  useEffect(() => {
    if (!isDirty) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const cancelLeave = useCallback(() => {
    setDialogOpen(false)
    pendingNavigationRef.current = null
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  const confirmLeave = useCallback(() => {
    setDialogOpen(false)
    isDirtyRef.current = false
    setIsDirtyState(false)

    if (blocker.state === 'blocked') {
      blocker.proceed()
      pendingNavigationRef.current = null
      return
    }

    const pending = pendingNavigationRef.current
    pendingNavigationRef.current = null
    if (pending) {
      navigate(pending.to, pending.options)
    }
  }, [blocker, navigate])

  const requestNavigation = useCallback(
    (to: string, options?: NavigateOptions) => {
      if (!isDirtyRef.current) {
        navigate(to, options)
        return
      }

      pendingNavigationRef.current = { to, options }
      setDialogOpen(true)
    },
    [navigate],
  )

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setDirty, requestNavigation }}>
      {children}
      <LeaveConfirmDialog
        open={dialogOpen}
        onCancel={cancelLeave}
        onConfirm={confirmLeave}
      />
    </UnsavedChangesContext.Provider>
  )
}

export { useUnsavedChanges } from '../hooks/useUnsavedChanges'
