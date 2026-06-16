import type { TFunction } from 'i18next'

export type FaceImageVisualState =
  | 'idle'
  | 'uploading'
  | 'saving'
  | 'saved'
  | 'removing'
  | 'removed'
  | 'reverting'
  | 'failed'

export type FaceFeedbackFlash = 'saved' | 'removed' | 'changesSaved'

export function isFaceOperationActive(state: FaceImageVisualState): boolean {
  return state === 'uploading' || state === 'saving' || state === 'removing' || state === 'reverting'
}

export function getFaceOverlayLabel(state: FaceImageVisualState, t: TFunction): string | null {
  switch (state) {
    case 'uploading':
      return t('form.faceUploadingImage')
    case 'saving':
      return t('form.faceSavingImage')
    case 'removing':
      return t('form.faceRemovingImage')
    case 'reverting':
      return t('form.faceRevertingImage')
    default:
      return null
  }
}
