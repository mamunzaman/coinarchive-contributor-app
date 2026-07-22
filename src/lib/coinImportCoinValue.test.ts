import { describe, expect, it } from 'vitest'
import { appendCoinFormData } from './coinFormData'
import {
  applySelectedImportReview,
  buildCoinImportReviewModel,
  normalizeCoinLinkImportResult,
  type CoinLinkImportResult,
} from './coinImport'
import {
  normalizeImportCoinValue,
  resolveImportDenominationValue,
} from './coinImportCoinValue'
import { mapCoinImportToFormValues } from './mapCoinImportToFormValues'
import { EMPTY_COIN_FORM_VALUES, type CoinFormValues } from '../types/coinForm'
import type { FormOptions, TaxonomyOption } from '../types/formOptions'

const TWO_EURO_EN: TaxonomyOption = {
  id: 42,
  name: '2 Euro',
  slug: '2-euro',
}

const TWO_EURO_DE: TaxonomyOption = {
  id: 42,
  name: '2 Euro',
  slug: '2-euro',
}

const ONE_EURO: TaxonomyOption = {
  id: 41,
  name: '1 Euro',
  slug: '1-euro',
}

function buildFormOptions(values: TaxonomyOption[] = [TWO_EURO_EN, ONE_EURO]): FormOptions {
  return {
    countries: [{ id: 1, name: 'Germany', slug: 'germany' }],
    values,
    types: [{ id: 2, name: 'Commemorative', slug: 'commemorative' }],
    series: [],
  }
}

function buildResult(overrides: {
  denomination?: string
  coinValue?: unknown
  missing?: string[]
  unmatched?: string[]
  conflicts?: unknown
}): CoinLinkImportResult {
  return normalizeCoinLinkImportResult(
    {
      sourceUrl: 'https://www.bundesbank.de/example',
      sourceName: 'Deutsche Bundesbank',
      confidence: 'high',
      extracted: {
        denomination: overrides.denomination,
        coin_value: overrides.coinValue,
        year: '2024',
        country: 'Germany',
      },
      missing: overrides.missing ?? [],
      unmatched: overrides.unmatched,
      conflicts: overrides.conflicts,
      warnings: [],
    },
    'https://www.bundesbank.de/example',
  )
}

describe('normalizeImportCoinValue', () => {
  it('accepts a valid matched term', () => {
    expect(
      normalizeImportCoinValue({
        term_id: 42,
        slug: '2-euro',
        value: '2 Euro',
        label: '2 Euro',
      }),
    ).toEqual({
      termId: 42,
      slug: '2-euro',
      value: '2 Euro',
      label: '2 Euro',
    })
  })

  it('rejects zero, negative, and non-numeric term_id', () => {
    expect(normalizeImportCoinValue({ term_id: 0, slug: '2-euro', label: '2 Euro' })).toBeUndefined()
    expect(normalizeImportCoinValue({ term_id: -1, slug: '2-euro', label: '2 Euro' })).toBeUndefined()
    expect(
      normalizeImportCoinValue({ term_id: 'abc', slug: '2-euro', label: '2 Euro' }),
    ).toBeUndefined()
    expect(normalizeImportCoinValue({ term_id: 3.5, slug: '2-euro', label: '2 Euro' })).toBeUndefined()
  })

  it('rejects non-object coin_value', () => {
    expect(normalizeImportCoinValue('2 Euro')).toBeUndefined()
    expect(normalizeImportCoinValue(null)).toBeUndefined()
  })
})

describe('resolveImportDenominationValue / map apply', () => {
  it('applies a valid matched term to the denomination form field as taxonomy name', () => {
    const result = buildResult({
      denomination: '2 Euro',
      coinValue: {
        term_id: 42,
        slug: '2-euro',
        value: '2 Euro',
        label: '2 Euro',
      },
    })

    const mapped = mapCoinImportToFormValues(result, buildFormOptions(), 'en')
    expect(mapped.values.denomination).toBe('2 Euro')
  })

  it('uses EN and DE plugin labels for display while mapping via term id', () => {
    const enResult = buildResult({
      denomination: '2 Euro',
      coinValue: {
        term_id: 42,
        slug: '2-euro',
        value: '2 Euro',
        label: '2 Euro',
      },
    })
    const deResult = buildResult({
      denomination: '2 Euro',
      coinValue: {
        term_id: 42,
        slug: '2-euro',
        value: '2 Euro',
        label: '2 Euro',
      },
    })

    expect(enResult.extracted.coinValue?.label).toBe('2 Euro')
    expect(deResult.extracted.coinValue?.label).toBe('2 Euro')

    const deOptions = buildFormOptions([
      { id: 42, name: '2 Euro', slug: '2-euro' },
      ONE_EURO,
    ])
    expect(mapCoinImportToFormValues(deResult, deOptions, 'de').values.denomination).toBe('2 Euro')
    expect(mapCoinImportToFormValues(enResult, buildFormOptions([TWO_EURO_DE, ONE_EURO]), 'en').values.denomination).toBe(
      '2 Euro',
    )
  })

  it('does not map when coin_value is missing from the response', () => {
    const result = buildResult({
      denomination: '2 Euro',
      missing: ['coin_value'],
    })
    expect(mapCoinImportToFormValues(result, buildFormOptions(), 'en').values.denomination).toBeUndefined()
  })

  it('does not map unmatched coin_value', () => {
    const result = buildResult({
      denomination: 'Something odd',
      unmatched: ['coin_value'],
      coinValue: {
        term_id: 999,
        slug: 'unknown',
        value: 'Something odd',
        label: 'Something odd',
      },
    })
    expect(mapCoinImportToFormValues(result, buildFormOptions(), 'en').values.denomination).toBeUndefined()
  })

  it('does not map denomination conflicts with an empty winner', () => {
    const result = buildResult({
      denomination: '2 Euro',
      coinValue: {
        term_id: 42,
        slug: '2-euro',
        value: '2 Euro',
        label: '2 Euro',
      },
      conflicts: [{ field: 'denomination', winner: '' }],
    })
    expect(mapCoinImportToFormValues(result, buildFormOptions(), 'en').values.denomination).toBeUndefined()
  })

  it('leaves an existing manual denomination unchanged on failure paths', () => {
    const current: CoinFormValues = {
      ...EMPTY_COIN_FORM_VALUES,
      denomination: '1 Euro',
    }

    const failureCases = [
      buildResult({ missing: ['coin_value'], denomination: '2 Euro' }),
      buildResult({
        unmatched: ['coin_value'],
        denomination: 'Weird',
        coinValue: { term_id: 999, slug: 'x', label: 'Weird', value: 'Weird' },
      }),
      buildResult({
        denomination: '2 Euro',
        coinValue: { term_id: 42, slug: '2-euro', label: '2 Euro', value: '2 Euro' },
        conflicts: [{ field: 'denomination', winner: null }],
      }),
      buildResult({
        denomination: '2 Euro',
        coinValue: { term_id: 0, slug: '2-euro', label: '2 Euro', value: '2 Euro' },
      }),
    ]

    for (const result of failureCases) {
      const review = buildCoinImportReviewModel(result, current, buildFormOptions(), 'en')
      const next = applySelectedImportReview(
        current,
        review,
        {
          fieldKeys: ['denomination'],
          mintMarkCodes: [],
          replaceExistingMint: false,
        },
        undefined,
      )
      expect(next.denomination).toBe('1 Euro')
    }
  })
})

describe('preview / review presentation', () => {
  it('shows denomination text and matched taxonomy label when coin_value matches', () => {
    const result = buildResult({
      denomination: '2 €',
      coinValue: {
        term_id: 42,
        slug: '2-euro',
        value: '2 Euro',
        label: '2 Euro',
      },
    })
    const review = buildCoinImportReviewModel(
      result,
      EMPTY_COIN_FORM_VALUES,
      buildFormOptions(),
      'en',
    )
    const row = review.sections.flatMap((section) => section.fields).find((field) => field.key === 'denomination')

    expect(row?.aiValue).toBe('2 €')
    expect(row?.matchedValue).toBe('2 Euro')
    expect(row?.status).toBe('ready')
    expect(row?.defaultSelected).toBe(true)
  })

  it('marks missing/conflict/unmatched denomination as needs_review or missing without apply value', () => {
    const missingReview = buildCoinImportReviewModel(
      buildResult({ missing: ['coin_value'] }),
      EMPTY_COIN_FORM_VALUES,
      buildFormOptions(),
      'en',
    )
    const missingRow = missingReview.sections
      .flatMap((section) => section.fields)
      .find((field) => field.key === 'denomination')
    expect(missingRow?.matchedValue).toBeUndefined()
    expect(missingRow?.status === 'missing' || missingRow?.status === 'needs_review').toBe(true)
    expect(missingRow?.reviewHintKey).toBe('coinImport.review.coinValueMissing')

    const conflictReview = buildCoinImportReviewModel(
      buildResult({
        denomination: '2 Euro',
        coinValue: { term_id: 42, slug: '2-euro', label: '2 Euro', value: '2 Euro' },
        conflicts: [{ field: 'denomination', winner: '' }],
      }),
      EMPTY_COIN_FORM_VALUES,
      buildFormOptions(),
      'en',
    )
    const conflictRow = conflictReview.sections
      .flatMap((section) => section.fields)
      .find((field) => field.key === 'denomination')
    expect(conflictRow?.status).toBe('needs_review')
    expect(conflictRow?.matchedValue).toBeUndefined()
    expect(conflictRow?.reviewHintKey).toBe('coinImport.review.denominationConflict')
    expect(conflictRow?.defaultSelected).toBe(false)
  })
})

describe('submission payload identifier', () => {
  it('submits denomination as the taxonomy option name', () => {
    const formData = new FormData()
    appendCoinFormData(
      formData,
      {
        ...EMPTY_COIN_FORM_VALUES,
        title: 'Test',
        country: 'Germany',
        year: '2024',
        denomination: '2 Euro',
        coin_type: 'Commemorative',
        short_description: 'Short',
        released_date: '2024-01-01',
      },
      undefined,
      { formOptions: buildFormOptions() },
    )

    expect(formData.get('denomination')).toBe('2 Euro')
  })

  it('resolveImportDenominationValue returns taxonomy name for valid coin_value', () => {
    expect(
      resolveImportDenominationValue({
        denomination: '2 €',
        coinValue: {
          termId: 42,
          slug: '2-euro',
          value: '2 Euro',
          label: '2 Euro',
        },
        options: [TWO_EURO_EN, ONE_EURO],
      }),
    ).toBe('2 Euro')
  })
})
