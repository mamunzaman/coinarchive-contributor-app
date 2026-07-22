import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrapI18n } from '../i18n'
import { resolveImportedMintMark } from './coinImportMintMark'
import { appendCoinFormData } from './coinFormData'
import { EMPTY_COIN_FORM_VALUES, coinFormValuesFromSubmission } from '../types/coinForm'
import { validateNewCoinForm } from './validation'
import {
  applySelectedImportReview,
  buildCoinImportReviewModel,
  mapImportExtendedFromResult,
  type CoinLinkImportResult,
} from './coinImport'
import type { FormOptions } from '../types/formOptions'

beforeAll(async () => {
  await bootstrapI18n()
})

const emptyFormOptions: FormOptions = {
  countries: [],
  values: [],
  types: [],
  series: [],
}

function baseImportResult(
  extracted: CoinLinkImportResult['extracted'],
): CoinLinkImportResult {
  return {
    sourceUrl: 'https://example.com/coin',
    sourceName: 'Deutsche Bundesbank',
    confidence: 'high',
    extracted,
    missing: [],
    warnings: [],
  }
}

describe('mintMark field', () => {
  it('defaults to empty and hydrates from acf.mint_mark', () => {
    expect(EMPTY_COIN_FORM_VALUES.mintMark).toBe('')

    const values = coinFormValuesFromSubmission({
      id: 1,
      title: 'Test',
      status: 'pending',
      country: 'Germany',
      denomination: '10 Euro',
      coin_type: 'Commemorative',
      year: 2024,
      short_description: '',
      acf: { mint_mark: 'D' },
    })

    expect(values.mintMark).toBe('D')
  })

  it('rejects invalid mint marks in validation', () => {
    const errors = validateNewCoinForm({
      ...EMPTY_COIN_FORM_VALUES,
      title: 'Coin',
      country: 'Germany',
      year: '2024',
      denomination: '2 Euro',
      coin_type: 'Commemorative',
      released_date: '2024-01-01',
      mintMark: 'Z',
    })
    expect(errors.mintMark).toBeTruthy()
  })

  it('accepts allowed mint marks and submits mint_mark payload', () => {
    const errors = validateNewCoinForm({
      ...EMPTY_COIN_FORM_VALUES,
      title: 'Coin',
      country: 'Germany',
      year: '2024',
      denomination: '2 Euro',
      coin_type: 'Commemorative',
      released_date: '2024-01-01',
      mintMark: 'J',
    })
    expect(errors.mintMark).toBeUndefined()

    const formData = new FormData()
    appendCoinFormData(formData, {
      ...EMPTY_COIN_FORM_VALUES,
      title: 'Coin',
      country: 'Germany',
      year: '2024',
      denomination: '2 Euro',
      coin_type: 'Commemorative',
      released_date: '2024-01-01',
      mintMark: 'A',
    })
    expect(formData.get('mint_mark')).toBe('A')
  })
})

describe('resolveImportedMintMark', () => {
  it('selects a single explicit mark', () => {
    expect(resolveImportedMintMark({ mint_mark: 'F' })).toEqual({
      status: 'single',
      mintMark: 'F',
    })
  })

  it('selects a single mark from mintMarksAvailable', () => {
    expect(resolveImportedMintMark({ mintMarksAvailable: 'G' })).toEqual({
      status: 'single',
      mintMark: 'G',
    })
  })

  it('flags multiple marks without choosing one', () => {
    const result = resolveImportedMintMark({ mintMarksAvailable: 'A, D, F, G, J' })
    expect(result.status).toBe('multiple')
    if (result.status === 'multiple') {
      expect(result.codes).toEqual(['A', 'D', 'F', 'G', 'J'])
    }
  })
})

describe('mintMark import apply/review', () => {
  it('applies a single imported mark and keeps selection on multiple', () => {
    const single = baseImportResult({
      mintMarksAvailable: 'D',
      title: 'Coin',
    })
    const extended = mapImportExtendedFromResult(single)
    expect(extended.mintMark).toBe('D')

    const review = buildCoinImportReviewModel(
      single,
      { ...EMPTY_COIN_FORM_VALUES, mintMark: '' },
      emptyFormOptions,
      'en',
    )
    const mintMarkRow = review.sections
      .flatMap((section) => section.fields)
      .find((row) => row.key === 'mint_mark')
    expect(mintMarkRow?.applyValue).toBe('D')
    expect(mintMarkRow?.reviewHintKey).toBeUndefined()

    const applied = applySelectedImportReview(
      { ...EMPTY_COIN_FORM_VALUES, mintMark: '' },
      review,
      {
        fieldKeys: ['mint_mark'],
        mintMarkCodes: [],
        replaceExistingMint: false,
      },
      extended,
    )
    expect(applied.mintMark).toBe('D')

    const multi = baseImportResult({
      mintMarksAvailable: 'A, D, F, G, J',
      title: 'Coin',
    })
    const multiExtended = mapImportExtendedFromResult(multi)
    expect(multiExtended.mintMark).toBeUndefined()

    const multiReview = buildCoinImportReviewModel(
      multi,
      { ...EMPTY_COIN_FORM_VALUES, mintMark: 'J' },
      emptyFormOptions,
      'en',
    )
    const multiRow = multiReview.sections
      .flatMap((section) => section.fields)
      .find((row) => row.key === 'mint_mark')
    expect(multiRow?.reviewHintKey).toBe('coinImport.review.mintMarkMultipleWarning')
    expect(multiRow?.status).toBe('needs_review')

    const multiApplied = applySelectedImportReview(
      { ...EMPTY_COIN_FORM_VALUES, mintMark: 'J' },
      multiReview,
      {
        fieldKeys: ['mint_mark'],
        mintMarkCodes: [],
        replaceExistingMint: false,
      },
      multiExtended,
    )
    expect(multiApplied.mintMark).toBe('J')
  })
})
