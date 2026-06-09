import type { DefaultImageRef } from '../types/formOptions'

export type ImagePreviewSource = 'selected' | 'existing' | 'default' | 'none'

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
