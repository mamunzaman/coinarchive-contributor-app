export type GalleryOperationState =
  | 'idle'
  | 'uploading'
  | 'removing'
  | 'saving'
  | 'success'
  | 'error'

export type GalleryOperationInput = {
  removingCount: number
  hasPendingUploading: boolean
  hasReplaceUploading: boolean
  activeSaveCount: number
  isFaceSaving: boolean
  hasGalleryFailures: boolean
  showSavedFlash: boolean
}

export function isGalleryOperationBusyInput(input: Omit<GalleryOperationInput, 'showSavedFlash'>): boolean {
  if (input.removingCount > 0) {
    return true
  }

  if (input.hasPendingUploading || input.hasReplaceUploading) {
    return true
  }

  return input.activeSaveCount > 0 && !input.isFaceSaving
}

export function resolveGalleryOperationState(input: GalleryOperationInput): GalleryOperationState {
  if (input.removingCount > 0) {
    return 'removing'
  }

  if (input.hasPendingUploading || input.hasReplaceUploading) {
    return 'uploading'
  }

  if (input.activeSaveCount > 0 && !input.isFaceSaving) {
    return 'saving'
  }

  if (input.hasGalleryFailures) {
    return 'error'
  }

  if (input.showSavedFlash) {
    return 'success'
  }

  return 'idle'
}

export function isGalleryOperationBusy(state: GalleryOperationState): boolean {
  return state === 'uploading' || state === 'removing' || state === 'saving'
}
