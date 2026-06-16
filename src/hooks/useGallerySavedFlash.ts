import { useEffect, useRef, useState } from 'react'
import { runAfterCommit } from '../lib/runAfterCommit'

export function useGallerySavedFlash(isGalleryBusy: boolean, blockSuccess = false) {
  const [savedFlash, setSavedFlash] = useState(false)
  const wasBusyRef = useRef(false)

  useEffect(() => {
    if (wasBusyRef.current && !isGalleryBusy && !blockSuccess) {
      runAfterCommit(() => {
        setSavedFlash(true)
      })
      const timer = window.setTimeout(() => setSavedFlash(false), 2500)
      wasBusyRef.current = isGalleryBusy
      return () => window.clearTimeout(timer)
    }
    wasBusyRef.current = isGalleryBusy
    return undefined
  }, [blockSuccess, isGalleryBusy])

  return savedFlash
}
