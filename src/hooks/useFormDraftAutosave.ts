import { useCallback, useEffect, useRef, useState } from 'react'
import type { CoinFormValues } from '../types/coinForm'
import type { CoinFormStepId } from '../types/coinFormSteps'
import {
  fileToSerializedImage,
  getDraftStorageKey,
  saveFormDraft,
  type DraftIndexEntry,
  type FormDraftPayload,
} from '../lib/formDraftStorage'

const AUTOSAVE_INTERVAL_MS = 10_000

type UseFormDraftAutosaveOptions = {
  kind: 'new' | 'edit'
  submissionId?: number
  values: CoinFormValues
  obverseFile: File | null
  reverseFile: File | null
  galleryFiles: File[]
  removedGalleryImageIds?: number[]
  activeStepId?: CoinFormStepId
  isDirty: boolean
  enabled?: boolean
}

export function useFormDraftAutosave({
  kind,
  submissionId,
  values,
  obverseFile,
  reverseFile,
  galleryFiles,
  removedGalleryImageIds = [],
  activeStepId,
  isDirty,
  enabled = true,
}: UseFormDraftAutosaveOptions) {
  const draftKey = getDraftStorageKey(kind, submissionId)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const isSavingRef = useRef(false)

  const persistDraft = useCallback(async () => {
    if (!enabled || isSavingRef.current) {
      return false
    }

    isSavingRef.current = true
    setSaveError(null)

    try {
      const [serializedObverse, serializedReverse, serializedGallery] = await Promise.all([
        obverseFile ? fileToSerializedImage(obverseFile) : Promise.resolve(null),
        reverseFile ? fileToSerializedImage(reverseFile) : Promise.resolve(null),
        Promise.all(galleryFiles.map((file) => fileToSerializedImage(file))),
      ])

      const savedAt = new Date().toISOString()
      const payload: FormDraftPayload = {
        values,
        obverseFile: serializedObverse,
        reverseFile: serializedReverse,
        galleryFiles: serializedGallery,
        removedGalleryImageIds,
        activeStepId,
        savedAt,
      }

      const indexEntry: DraftIndexEntry = {
        key: draftKey,
        kind,
        submissionId,
        title: values.title.trim() || (kind === 'new' ? 'Untitled draft' : `Submission #${submissionId}`),
        updatedAt: savedAt,
      }

      const saved = saveFormDraft(draftKey, payload, indexEntry)
      if (!saved) {
        setSaveError('Draft could not be saved locally.')
        return false
      }

      setLastSavedAt(savedAt)
      return true
    } catch {
      setSaveError('Draft could not be saved locally.')
      return false
    } finally {
      isSavingRef.current = false
    }
  }, [
    activeStepId,
    draftKey,
    enabled,
    galleryFiles,
    kind,
    obverseFile,
    removedGalleryImageIds,
    reverseFile,
    submissionId,
    values,
  ])

  useEffect(() => {
    if (!enabled || !isDirty) {
      return
    }

    const timer = window.setInterval(() => {
      void persistDraft()
    }, AUTOSAVE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [enabled, isDirty, persistDraft])

  return {
    draftKey,
    lastSavedAt,
    saveError,
    saveDraftNow: persistDraft,
  }
}
