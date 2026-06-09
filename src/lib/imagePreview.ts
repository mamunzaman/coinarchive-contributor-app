import type { DefaultImageRef } from '../types/formOptions'
import type { ImageLoadStatus } from '../hooks/useImageLoadState'

export type ImagePreviewSource = 'selected' | 'existing' | 'default' | 'none'

export type CoinImagePreviewDisplayState =
  | 'empty'
  | 'loading-default'
  | 'loading-image'
  | 'loaded'
  | 'error'

export function resolveCoinImagePreviewDisplayState(options: {
  formOptionsLoading?: boolean
  previewSource?: ImagePreviewSource
  previewUrl?: string | null
  imageLoadStatus: ImageLoadStatus
  isNewSelection?: boolean
}): CoinImagePreviewDisplayState {
  const {
    formOptionsLoading = false,
    previewSource = 'none',
    previewUrl,
    imageLoadStatus,
    isNewSelection = false,
  } = options

  if (previewUrl && imageLoadStatus === 'loaded') {
    return 'loaded'
  }

  if (previewUrl && imageLoadStatus === 'error') {
    return 'error'
  }

  if (
    formOptionsLoading &&
    !isNewSelection &&
    previewSource !== 'selected' &&
    previewSource !== 'existing'
  ) {
    return 'loading-default'
  }

  if (
    previewSource === 'default' &&
    !previewUrl &&
    !isNewSelection
  ) {
    return 'loading-default'
  }

  if (previewUrl) {
    return 'loading-image'
  }

  return 'empty'
}

export function getCoinImagePreviewLoadingText(
  displayState: CoinImagePreviewDisplayState,
  previewSource: ImagePreviewSource = 'none',
): string | null {
  if (displayState === 'loading-default') {
    return 'Loading default image…'
  }

  if (displayState === 'loading-image') {
    return previewSource === 'default' ? 'Loading default image…' : 'Loading image…'
  }

  return null
}

export function getDefaultImagePreviewUrl(ref?: DefaultImageRef | null): string | null {
  if (!ref) {
    return null
  }

  return ref.thumb_url || ref.url || null
}

export function getImagePreviewSource(
  file: File | null | undefined,
  existingUrl?: string | null,
  defaultRef?: DefaultImageRef | null,
): ImagePreviewSource {
  if (file) {
    return 'selected'
  }

  if (existingUrl) {
    return 'existing'
  }

  if (getDefaultImagePreviewUrl(defaultRef)) {
    return 'default'
  }

  return 'none'
}

export function hasEffectiveCoinImage(
  file: File | null | undefined,
  existingUrl?: string | null,
  defaultRef?: DefaultImageRef | null,
): boolean {
  return getImagePreviewSource(file, existingUrl, defaultRef) !== 'none'
}

export function getImagePreviewLabel(source: ImagePreviewSource, fileName?: string | null): string {
  if (source === 'selected' && fileName) {
    return fileName
  }

  if (source === 'selected') {
    return 'Image selected'
  }

  if (source === 'existing') {
    return 'Current image'
  }

  if (source === 'default') {
    return 'WordPress default will be used'
  }

  return 'No file selected'
}

export function getImageWorkspaceStatusLabel(source: ImagePreviewSource, ready: boolean): string {
  if (source === 'default') {
    return 'WordPress default'
  }

  if (ready) {
    return 'Ready'
  }

  return 'Missing'
}
