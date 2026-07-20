/**
 * Lightweight host allowlist checks for coin link import sources.
 * Run: npx --yes tsx scripts/verify-coin-import-hosts.ts
 */
import {
  findCoinImportSourceAdapterByUrl,
  resolveImportSourceTypeFromUrl,
  resolveOfficialSourceNameFromUrl,
} from '../src/lib/coinImportSources'
import { validateCoinImportUrl, validateCoinImportUrlFields } from '../src/lib/coinImport'

type Case = {
  label: string
  url: string
  expectValid: boolean
  expectRole?: 'primary' | 'supplemental'
  expectName?: string
}

const cases: Case[] = [
  {
    label: 'Eurocoinhouse primary sample',
    url: 'https://www.eurocoinhouse.com/de/laender/deutschland/duitsland-2-euro-2025-35-jaar-duitse-eenheid',
    expectValid: true,
    expectRole: 'primary',
    expectName: 'Eurocoinhouse',
  },
  {
    label: 'Zwei-Euro supplemental sample',
    url: 'https://zwei-euro.com/deutschland/gedenkmuenzen/bremen-2026/',
    expectValid: true,
    expectRole: 'supplemental',
    expectName: 'Zwei-Euro',
  },
  {
    label: 'Bundesbank preserved',
    url: 'https://www.bundesbank.de/de/aufgaben/bargeld/euro-muenzen/gedenkmuenzen',
    expectValid: true,
    expectRole: 'primary',
    expectName: 'Deutsche Bundesbank',
  },
  {
    label: 'Münze Deutschland preserved',
    url: 'https://www.muenze-deutschland.de/2-euro-gedenkmuenze',
    expectValid: true,
    expectRole: 'supplemental',
    expectName: 'Münze Deutschland',
  },
  {
    label: 'Unsupported host rejected',
    url: 'https://example.com/coin/page',
    expectValid: false,
  },
  {
    label: 'Credentialed URL rejected',
    url: 'https://user:pass@www.eurocoinhouse.com/de/coin',
    expectValid: false,
  },
  {
    label: 'javascript scheme rejected',
    url: 'javascript:alert(1)',
    expectValid: false,
  },
]

let failed = 0

for (const testCase of cases) {
  const result = validateCoinImportUrl(testCase.url)
  const role = resolveImportSourceTypeFromUrl(testCase.url)
  const name = resolveOfficialSourceNameFromUrl(testCase.url)
  const adapter = findCoinImportSourceAdapterByUrl(testCase.url)

  const okValid = result.valid === testCase.expectValid
  const okRole = testCase.expectRole ? role === testCase.expectRole : true
  const okName = testCase.expectName ? name === testCase.expectName : true
  const okAdapter = testCase.expectValid ? Boolean(adapter) : true

  if (okValid && okRole && okName && okAdapter) {
    console.log(`PASS  ${testCase.label}`)
  } else {
    failed += 1
    console.error(`FAIL  ${testCase.label}`, {
      valid: result.valid,
      role,
      name,
      adapter: adapter?.id,
    })
  }
}

const multi = validateCoinImportUrlFields({
  primary:
    'https://www.eurocoinhouse.com/de/laender/deutschland/duitsland-2-euro-2025-35-jaar-duitse-eenheid',
  extra: 'https://zwei-euro.com/deutschland/gedenkmuenzen/bremen-2026/',
})

if (multi.valid && multi.source_urls.length === 2) {
  console.log('PASS  Multi-source Eurocoinhouse + Zwei-Euro')
} else {
  failed += 1
  console.error('FAIL  Multi-source Eurocoinhouse + Zwei-Euro', multi)
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}

console.log('\nAll coin import host checks passed')
