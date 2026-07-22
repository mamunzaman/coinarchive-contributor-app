import { describe, expect, it } from 'vitest'
import {
  findCoinImportSourceAdapterByUrl,
  resolveImportSourceTypeFromUrl,
  resolveOfficialSourceNameFromUrl,
} from './coinImportSources'
import { validateCoinImportUrl, validateCoinImportUrlFields } from './coinImport'

describe('muenzen.eu import source allowlist', () => {
  const validUrl =
    'https://www.muenzen.eu/gedenkmuenze/deutschland-10-euro-euroeinfuehrung-2002.html'

  it('accepts valid muenzen.eu URLs as supplemental Input 2 sources', () => {
    const result = validateCoinImportUrl(validUrl)
    expect(result.valid).toBe(true)
    expect(resolveImportSourceTypeFromUrl(validUrl)).toBe('supplemental')
    expect(resolveOfficialSourceNameFromUrl(validUrl)).toBe('Münzen.eu')
    expect(findCoinImportSourceAdapterByUrl(validUrl)?.id).toBe('muenzen-eu')
  })

  it('rejects invalid / unsupported hosts', () => {
    expect(validateCoinImportUrl('https://example.com/coin.html').valid).toBe(false)
    expect(validateCoinImportUrl('https://muenzen.example/coin.html').valid).toBe(false)
    expect(validateCoinImportUrl('not-a-url').valid).toBe(false)
  })

  it('allows primary + muenzen.eu supplemental pair', () => {
    const multi = validateCoinImportUrlFields({
      primary: 'https://www.bundesbank.de/de/aufgaben/bargeld/euro-muenzen/gedenkmuenzen',
      extra: validUrl,
    })
    expect(multi.valid).toBe(true)
    expect(multi.source_urls).toHaveLength(2)
  })

  it('keeps eurocoinhouse and zwei-euro behavior unchanged', () => {
    const eurocoinhouse =
      'https://www.eurocoinhouse.com/de/laender/deutschland/duitsland-2-euro-2025-35-jaar-duitse-eenheid'
    const zweiEuro = 'https://zwei-euro.com/deutschland/gedenkmuenzen/bremen-2026/'

    expect(validateCoinImportUrl(eurocoinhouse).valid).toBe(true)
    expect(resolveImportSourceTypeFromUrl(eurocoinhouse)).toBe('primary')
    expect(validateCoinImportUrl(zweiEuro).valid).toBe(true)
    expect(resolveImportSourceTypeFromUrl(zweiEuro)).toBe('supplemental')
  })
})
