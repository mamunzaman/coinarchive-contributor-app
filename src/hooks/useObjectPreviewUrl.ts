import { useEffect, useState } from 'react'
import { runAfterCommit } from '../lib/runAfterCommit'

export function useObjectPreviewUrl(file: File | null, fallbackUrl?: string | null): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      runAfterCommit(() => {
        setObjectUrl(null)
      })
      return
    }

    const url = URL.createObjectURL(file)
    runAfterCommit(() => {
      setObjectUrl(url)
    })

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  if (file && objectUrl) {
    return objectUrl
  }

  return fallbackUrl ?? null
}
