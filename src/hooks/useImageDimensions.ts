import { useEffect, useState } from 'react'
import { runAfterCommit } from '../lib/runAfterCommit'

export function useImageDimensions(source: File | string | null | undefined) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (!source) {
      runAfterCommit(() => {
        setDimensions(null)
      })
      return
    }

    let cancelled = false
    const objectUrl = typeof source === 'string' ? source : URL.createObjectURL(source)
    const image = new Image()

    image.onload = () => {
      if (!cancelled) {
        setDimensions({ width: image.naturalWidth, height: image.naturalHeight })
      }

      if (typeof source !== 'string') {
        URL.revokeObjectURL(objectUrl)
      }
    }

    image.onerror = () => {
      if (!cancelled) {
        setDimensions(null)
      }

      if (typeof source !== 'string') {
        URL.revokeObjectURL(objectUrl)
      }
    }

    image.src = objectUrl

    return () => {
      cancelled = true
      if (typeof source !== 'string') {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [source])

  return dimensions
}
