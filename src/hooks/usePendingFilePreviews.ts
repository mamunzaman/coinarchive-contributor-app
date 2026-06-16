import { useEffect, useState } from 'react'
import { runAfterCommit } from '../lib/runAfterCommit'

type FilePreview = {
  key: string
  file: File
  url: string
  index: number
}

export function usePendingFilePreviews(files: File[]): FilePreview[] {
  const [previews, setPreviews] = useState<FilePreview[]>([])

  useEffect(() => {
    const next = files.map((file, index) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      file,
      url: URL.createObjectURL(file),
      index,
    }))

    runAfterCommit(() => {
      setPreviews(next)
    })

    return () => {
      for (const item of next) {
        URL.revokeObjectURL(item.url)
      }
    }
  }, [files])

  return previews
}
