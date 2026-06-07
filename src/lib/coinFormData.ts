import type { CoinFormImages, CoinFormValues, MintVariantRow } from '../types/coinForm'
import { hasMintFormData, isMintVariantRowFilled } from '../types/coinForm'
import type { CoinSubmissionDetail } from './api'

const OPTIONAL_STRING_FIELDS = [
  'coin_theme',
  'released_date',
  'coin_mintage',
  'coin_material',
  'coin_quality',
  'coin_weight_g',
  'coin_diameter_mm',
  'coin_thickness_mm',
  'coin_edge_inscription',
  'coin_obverse_description',
  'coin_reverse_description',
  'coin_historical_background',
  'coin_collector_notes',
] as const satisfies ReadonlyArray<keyof CoinFormValues>

export type AppendCoinFormDataOptions = {
  includeEmptyOptionalFields?: boolean
  isAdmin?: boolean
}

function appendBooleanField(formData: FormData, key: string, value: boolean): void {
  formData.append(key, value ? '1' : '0')
}

function appendMintFormData(
  formData: FormData,
  values: CoinFormValues,
  includeEmptyOptionalFields: boolean,
): void {
  if (!includeEmptyOptionalFields && !hasMintFormData(values)) {
    return
  }

  formData.append('has_mint_variants', values.hasMintVariants ? '1' : '0')

  if (!values.hasMintVariants) {
    const singleMintMark = values.singleMintMark.trim()
    if (singleMintMark || includeEmptyOptionalFields) {
      formData.append('single_mint_mark', singleMintMark)
    }
    return
  }

  const mintMarksAvailable = values.mintMarksAvailable.trim()
  if (mintMarksAvailable || includeEmptyOptionalFields) {
    formData.append('mint_marks_available', mintMarksAvailable)
  }

  const filledVariants = values.mintVariants.filter(isMintVariantRowFilled)
  filledVariants.forEach((row: MintVariantRow, index: number) => {
    formData.append(`mint_variants[${index}][mint_mark_code]`, row.mintMarkCode.trim())
    formData.append(`mint_variants[${index}][mint_mintage]`, row.mintMintage.trim())
    formData.append(`mint_variants[${index}][mint_notes]`, row.mintNotes.trim())
  })
}

export function appendCoinFormData(
  formData: FormData,
  values: CoinFormValues,
  images?: CoinFormImages,
  options?: AppendCoinFormDataOptions,
): void {
  formData.append('title', values.title.trim())
  formData.append('country', values.country.trim())
  formData.append('year', values.year.trim())
  formData.append('denomination', values.denomination.trim())
  formData.append('coin_type', values.coin_type.trim())
  formData.append('short_description', values.short_description.trim())

  const includeEmptyOptionalFields = options?.includeEmptyOptionalFields ?? false

  for (const key of OPTIONAL_STRING_FIELDS) {
    const value = values[key].trim()
    if (value || includeEmptyOptionalFields) {
      formData.append(key, value)
    }
  }

  if (options?.isAdmin) {
    appendBooleanField(formData, 'coin_is_published_catalogue', values.coin_is_published_catalogue)
    appendBooleanField(formData, 'coin_is_featured', values.coin_is_featured)
    appendBooleanField(formData, 'coin_is_app_enabled', values.coin_is_app_enabled)
    formData.append('coin_record_status', values.coin_record_status)
  }

  if (images?.obverse) {
    formData.append('obverse_image', images.obverse)
  }

  if (images?.reverse) {
    formData.append('reverse_image', images.reverse)
  }

  if (images?.gallery?.length) {
    for (const file of images.gallery) {
      formData.append('gallery_images[]', file)
    }
  }

  if (images?.removeGalleryImageIds?.length) {
    for (const id of images.removeGalleryImageIds) {
      formData.append('remove_gallery_image_ids[]', String(id))
    }
  }

  appendMintFormData(formData, values, includeEmptyOptionalFields)
}

function appendImageFields(
  formData: FormData,
  images: Pick<CoinFormImages, 'obverse' | 'reverse' | 'gallery' | 'removeGalleryImageIds'>,
): void {
  if (images.obverse) {
    formData.append('obverse_image', images.obverse)
  }

  if (images.reverse) {
    formData.append('reverse_image', images.reverse)
  }

  if (images.gallery?.length) {
    for (const file of images.gallery) {
      formData.append('gallery_images[]', file)
    }
  }

  if (images.removeGalleryImageIds?.length) {
    for (const id of images.removeGalleryImageIds) {
      formData.append('remove_gallery_image_ids[]', String(id))
    }
  }
}

/** Backend update requires core fields; echo current submission values unchanged. */
export function appendSubmissionImageUpdateFormData(
  formData: FormData,
  submission: CoinSubmissionDetail,
  images: Pick<CoinFormImages, 'obverse' | 'reverse' | 'gallery' | 'removeGalleryImageIds'>,
): void {
  formData.append('title', submission.title.trim())
  formData.append('country', submission.country.trim())
  formData.append('year', String(submission.year))
  formData.append('denomination', submission.denomination.trim())
  formData.append('coin_type', submission.coin_type.trim())
  formData.append('short_description', submission.short_description.trim())

  appendImageFields(formData, images)
}
