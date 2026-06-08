import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CoinFormValues } from '../types/coinForm'
import type { CoinFormStepId } from '../types/coinFormSteps'
import {
  fileToSerializedImage,
  getDraftStorageKey,
  saveFormDraft,
  type DraftIndexEntry,
  type FormDraftPayload,
} from '../lib/formDraftStorage'

const DEBOUNCE_MS = 2_500
const LABEL_TICK_MS = 30_000

export type CoinDraftSaveState = 'idle' | 'saving' | 'saved' | 'error'

type UseCoinDraftOptions = {
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

export function formatDraftSavedLabel(lastSavedAt: string | null, now = Date.now()): string {
  if (!lastSavedAt) {
    return 'No draft yet'
  }

  const savedTime = new Date(lastSavedAt).getTime()
  if (Number.isNaN(savedTime)) {
    return 'Saved just now'
  }

  const diffMs = now - savedTime
  if (diffMs < 60_000) {
    return 'Saved just now'
  }

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes === 1) {
    return 'Saved 1 min ago'
  }

  return `Saved ${minutes} min ago`
}

function buildDraftSignature(
  values: CoinFormValues,
  activeStepId: CoinFormStepId | undefined,
  obverseFile: File | null,
  reverseFile: File | null,
  galleryFiles: File[],
  removedGalleryImageIds: number[],
): string {
  return JSON.stringify({
    values,
    activeStepId,
    obverse: obverseFile
      ? `${obverseFile.name}:${obverseFile.size}:${obverseFile.lastModified}`
      : null,
    reverse: reverseFile
      ? `${reverseFile.name}:${reverseFile.size}:${reverseFile.lastModified}`
      : null,
    gallery: galleryFiles.map(
      (file) => `${file.name}:${file.size}:${file.lastModified}`,
    ),
    removedGalleryImageIds,
  })
}

export function useCoinDraft({
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
}: UseCoinDraftOptions) {
  const draftKey = getDraftStorageKey(kind, submissionId)
  const [saveState, setSaveState] = useState<CoinDraftSaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [labelTick, setLabelTick] = useState(0)

  const isSavingRef = useRef(false)
  const skipStepSaveRef = useRef(true)
  const debounceTimerRef = useRef<number | null>(null)
  const lastSavedSignatureRef = useRef<string | null>(null)
  const contentSignature = buildDraftSignature(
    values,
    activeStepId,
    obverseFile,
    reverseFile,
    galleryFiles,
    removedGalleryImageIds,
  )

  const persistDraft = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!enabled) {
        return false
      }

      if (!force && !isDirty) {
        return false
      }

      if (isSavingRef.current) {
        return false
      }

      isSavingRef.current = true
      setSaveState('saving')
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
          title:
            values.title.trim() ||
            (kind === 'new' ? 'Untitled draft' : `Submission #${submissionId}`),
          updatedAt: savedAt,
        }

        const saved = saveFormDraft(draftKey, payload, indexEntry)
        if (!saved) {
          setSaveError('Draft could not be saved locally.')
          setSaveState('error')
          return false
        }

        setLastSavedAt(savedAt)
        lastSavedSignatureRef.current = buildDraftSignature(
          values,
          activeStepId,
          obverseFile,
          reverseFile,
          galleryFiles,
          removedGalleryImageIds,
        )
        setHasPendingChanges(false)
        setSaveState('saved')
        return true
      } catch {
        setSaveError('Draft could not be saved locally.')
        setSaveState('error')
        return false
      } finally {
        isSavingRef.current = false
      }
    },
    [
      activeStepId,
      draftKey,
      enabled,
      galleryFiles,
      isDirty,
      kind,
      obverseFile,
      removedGalleryImageIds,
      reverseFile,
      submissionId,
      values,
    ],
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    if (
      lastSavedSignatureRef.current !== null &&
      contentSignature !== lastSavedSignatureRef.current
    ) {
      setHasPendingChanges(true)
      if (saveState === 'saved') {
        setSaveState('idle')
      }
    }
  }, [contentSignature, enabled, saveState])

  useEffect(() => {
    if (!enabled || !isDirty) {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      return
    }

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null
      void persistDraft()
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [contentSignature, enabled, isDirty, persistDraft])

  useEffect(() => {
    if (!enabled) {
      return
    }

    if (skipStepSaveRef.current) {
      skipStepSaveRef.current = false
      return
    }

    void persistDraft({ force: true })
  }, [activeStepId, enabled, persistDraft])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleBeforeUnload = () => {
      if (isDirty || hasPendingChanges) {
        void persistDraft({ force: true })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, hasPendingChanges, isDirty, persistDraft])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLabelTick((current) => current + 1)
    }, LABEL_TICK_MS)

    return () => window.clearInterval(timer)
  }, [])

  const savedLabel = useMemo(
    () => formatDraftSavedLabel(lastSavedAt, Date.now()),
    [labelTick, lastSavedAt],
  )

  const saveDraftNow = useCallback(() => persistDraft({ force: true }), [persistDraft])
  const flushDraft = useCallback(() => persistDraft({ force: true }), [persistDraft])

  return {
    draftKey,
    lastSavedAt,
    saveError,
    saveState,
    hasPendingChanges,
    savedLabel,
    saveDraftNow,
    flushDraft,
  }
}
