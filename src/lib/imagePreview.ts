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

export function getImageReviewStateLabel(source: ImagePreviewSource): string {
  if (source === 'selected') {
    return 'New image selected for upload'
  }

  if (source === 'existing') {
    return 'Existing submission image'
  }

  if (source === 'default') {
    return 'Will use WordPress default image'
  }

  return 'Not provided'
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

export type CoinImageClearActionVariant = 'default' | 'destructive'

export function resolveCoinImageClearAction(options: {
  sideLabel: string
  isNewSelection: boolean
  hasExistingImage: boolean
  imageEditMode?: boolean
  existingImageRemoved?: boolean
}): {
  label: string
  variant: CoinImageClearActionVariant
  ariaLabel: string
} | null {
  const {
    sideLabel,
    isNewSelection,
    hasExistingImage,
    imageEditMode = false,
    existingImageRemoved = false,
  } = options

  if (existingImageRemoved) {
    return null
  }

  if (isNewSelection) {
    const label = imageEditMode && hasExistingImage ? 'Use current image' : 'Use default'

    return {
      label,
      variant: 'default',
      ariaLabel: `${label} for ${sideLabel} image`,
    }
  }

  if (imageEditMode && hasExistingImage) {
    return {
      label: 'Remove image',
      variant: 'destructive',
      ariaLabel: `Remove ${sideLabel} image`,
    }
  }

  return null
}

export const COIN_IMAGE_REMOVE_PREVIEW_NOTICE =
  'Preview only — saving will not remove this image until backend support is added.'
