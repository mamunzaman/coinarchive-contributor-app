import { describe, expect, it } from 'vitest'
import {
  classifyMdmUrl,
  MDM_CATEGORY_REFERENCE_URL,
  MDM_PRODUCT_EXAMPLE_URL,
  isMdmListingUrl,
  isMdmProductUrl,
} from './coinImportMdm'
import {
  findCoinImportSourceAdapterByUrl,
  resolveImportSourceTypeFromUrl,
  resolveOfficialSourceNameFromUrl,
} from './coinImportSources'
import { validateCoinImportUrl, validateCoinImportUrlFields } from './coinImport'

describe('mdm.de import source', () => {
  it('accepts single-product MDM URLs as supplemental Input 2 sources', () => {
    const result = validateCoinImportUrl(MDM_PRODUCT_EXAMPLE_URL)
    expect(result.valid).toBe(true)
    expect(classifyMdmUrl(MDM_PRODUCT_EXAMPLE_URL)).toBe('product')
    expect(isMdmProductUrl(MDM_PRODUCT_EXAMPLE_URL)).toBe(true)
    expect(resolveImportSourceTypeFromUrl(MDM_PRODUCT_EXAMPLE_URL)).toBe('supplemental')
    expect(resolveOfficialSourceNameFromUrl(MDM_PRODUCT_EXAMPLE_URL)).toBe('MDM')
    expect(findCoinImportSourceAdapterByUrl(MDM_PRODUCT_EXAMPLE_URL)?.id).toBe('mdm')
  })

  it('detects category/listing URLs as non-importable', () => {
    const result = validateCoinImportUrl(MDM_CATEGORY_REFERENCE_URL)
    expect(result.valid).toBe(false)
    expect(result.errorKey).toBe('listingPage')
    expect(classifyMdmUrl(MDM_CATEGORY_REFERENCE_URL)).toBe('listing')
    expect(isMdmListingUrl(MDM_CATEGORY_REFERENCE_URL)).toBe(true)
  })

  it('rejects unsupported MDM paths', () => {
    expect(validateCoinImportUrl('https://www.mdm.de/').valid).toBe(false)
    expect(validateCoinImportUrl('https://www.mdm.de/muenzwelt/news').valid).toBe(false)
    expect(validateCoinImportUrl('https://www.mdm.de/cart').valid).toBe(false)
    expect(classifyMdmUrl('https://www.mdm.de/checkout')).toBe('unsupported')
    expect(classifyMdmUrl('https://www.mdm.de/muenzwelt')).toBe('unsupported')
  })

  it('keeps Münzen.eu, Eurocoinhouse and Zwei-Euro behavior unchanged', () => {
    const muenzen =
      'https://www.muenzen.eu/gedenkmuenze/deutschland-10-euro-euroeinfuehrung-2002.html'
    const eurocoinhouse =
      'https://www.eurocoinhouse.com/de/laender/deutschland/duitsland-2-euro-2025-35-jaar-duitse-eenheid'
    const zweiEuro = 'https://zwei-euro.com/deutschland/gedenkmuenzen/bremen-2026/'

    expect(validateCoinImportUrl(muenzen).valid).toBe(true)
    expect(resolveImportSourceTypeFromUrl(muenzen)).toBe('supplemental')
    expect(validateCoinImportUrl(eurocoinhouse).valid).toBe(true)
    expect(resolveImportSourceTypeFromUrl(eurocoinhouse)).toBe('primary')
    expect(validateCoinImportUrl(zweiEuro).valid).toBe(true)
    expect(resolveImportSourceTypeFromUrl(zweiEuro)).toBe('supplemental')
  })

  it('allows primary + MDM product supplemental pair', () => {
    const multi = validateCoinImportUrlFields({
      primary: 'https://www.bundesbank.de/de/aufgaben/bargeld/euro-muenzen/gedenkmuenzen',
      extra: MDM_PRODUCT_EXAMPLE_URL,
    })
    expect(multi.valid).toBe(true)
    expect(multi.source_urls).toHaveLength(2)
  })

  it('rejects MDM listing URL even when paired with a valid primary', () => {
    const multi = validateCoinImportUrlFields({
      primary: 'https://www.bundesbank.de/de/aufgaben/bargeld/euro-muenzen/gedenkmuenzen',
      extra: MDM_CATEGORY_REFERENCE_URL,
    })
    expect(multi.valid).toBe(false)
    expect(multi.fieldErrors.extra).toBe('listingPage')
  })
})
