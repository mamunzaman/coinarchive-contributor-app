import { validateImageFile } from './validation'

export function validateGalleryFiles(files: File[]): string | null {
  for (const file of files) {
    const error = validateImageFile(file)
    if (error) {
      return `${file.name}: ${error}`
    }
  }

  return null
}
