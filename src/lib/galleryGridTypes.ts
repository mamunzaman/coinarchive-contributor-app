export type GalleryExternalPendingItem = {
  key: string
  previewUrl: string
  fileName: string
  status: 'uploading' | 'failed'
  error?: string
}
