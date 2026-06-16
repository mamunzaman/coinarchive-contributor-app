import { useEffect, useRef, useState } from 'react'
import { runAfterCommit } from '../lib/runAfterCommit'

export function useFaceSectionSavedFlash(
  isSaving: boolean,
  obverseStatus: string,
  reverseStatus: string,
) {
  const [showSaved, setShowSaved] = useState(false)
  const wasSavingRef = useRef(false)

  useEffect(() => {
    if (wasSavingRef.current && !isSaving) {
      const failed = obverseStatus === 'failed' || reverseStatus === 'failed'
      if (!failed) {
        runAfterCommit(() => {
          setShowSaved(true)
        })
        const timer = window.setTimeout(() => setShowSaved(false), 2500)
        wasSavingRef.current = isSaving
        return () => window.clearTimeout(timer)
      }
    }
    wasSavingRef.current = isSaving
    return undefined
  }, [isSaving, obverseStatus, reverseStatus])

  return showSaved
}
