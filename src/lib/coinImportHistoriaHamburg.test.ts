import { describe, expect, it } from 'vitest'
import {
  classifyHistoriaHamburgUrl,
  HISTORIA_HAMBURG_PRODUCT_EXAMPLE_URL,
  isHistoriaHamburgProductUrl,
} from './coinImportHistoriaHamburg'
import {
  findCoinImportSourceAdapterByUrl,
  resolveImportSourceTypeFromUrl,
  resolveOfficialSourceNameFromUrl,
} from './coinImportSources'
import { validateCoinImportUrl, validateCoinImportUrlFields } from './coinImport'

describe('historia-hamburg.de import source', () => {
  const productWww = HISTORIA_HAMBURG_PRODUCT_EXAMPLE_URL
  const productBare = 'https://historia-hamburg.de/deutschland-10-euro-2024-polizei.html'

  it('accepts product URLs with and without www as Input 1 primary', () => {
    for (const url of [productWww, productBare]) {
      const result = validateCoinImportUrl(url)
      expect(result.valid).toBe(true)
      expect(classifyHistoriaHamburgUrl(url)).toBe('product')
      expect(isHistoriaHamburgProductUrl(url)).toBe(true)
      expect(resolveImportSourceTypeFromUrl(url)).toBe('primary')
      expect(resolveOfficialSourceNameFromUrl(url)).toBe('Historia Hamburg')
      expect(findCoinImportSourceAdapterByUrl(url)?.id).toBe('historia-hamburg')
    }
  })

  it('rejects category and unsupported paths', () => {
    expect(validateCoinImportUrl('https://www.historia-hamburg.de/2-euro-muenzen.html').valid).toBe(
      false,
    )
    expect(validateCoinImportUrl('https://www.historia-hamburg.de/2-euro-muenzen.html').errorKey).toBe(
      'listingPage',
    )
    expect(
      validateCoinImportUrl('https://www.historia-hamburg.de/2-euro-muenzen/deutschland.html').errorKey,
    ).toBe('listingPage')
    expect(validateCoinImportUrl('https://www.historia-hamburg.de/').valid).toBe(false)
    expect(validateCoinImportUrl('https://www.historia-hamburg.de/cart').valid).toBe(false)
    expect(validateCoinImportUrl('https://www.historia-hamburg.de/catalogsearch/result/').valid).toBe(
      false,
    )
    expect(classifyHistoriaHamburgUrl('https://www.historia-hamburg.de/customer/account')).toBe(
      'unsupported',
    )
  })

  it('keeps MDM, Münzen.eu, Eurocoinhouse and Zwei-Euro unchanged', () => {
    const mdm = 'https://www.mdm.de/10-euro-silber-gedenkmunze-einfuhrung-des-euro'
    const muenzen =
      'https://www.muenzen.eu/gedenkmuenze/deutschland-10-euro-euroeinfuehrung-2002.html'
    const eurocoinhouse =
      'https://www.eurocoinhouse.com/de/laender/deutschland/duitsland-2-euro-2025-35-jaar-duitse-eenheid'
    const zweiEuro = 'https://zwei-euro.com/deutschland/gedenkmuenzen/bremen-2026/'

    expect(validateCoinImportUrl(mdm).valid).toBe(true)
    expect(resolveImportSourceTypeFromUrl(mdm)).toBe('supplemental')
    expect(validateCoinImportUrl(muenzen).valid).toBe(true)
    expect(validateCoinImportUrl(eurocoinhouse).valid).toBe(true)
    expect(resolveImportSourceTypeFromUrl(eurocoinhouse)).toBe('primary')
    expect(validateCoinImportUrl(zweiEuro).valid).toBe(true)
  })

  it('allows Historia primary + MDM supplemental pair', () => {
    const multi = validateCoinImportUrlFields({
      primary: productWww,
      extra: 'https://www.mdm.de/10-euro-silber-gedenkmunze-einfuhrung-des-euro',
    })
    expect(multi.valid).toBe(true)
    expect(multi.source_urls).toHaveLength(2)
  })
})
