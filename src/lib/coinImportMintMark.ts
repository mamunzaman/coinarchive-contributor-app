import {
  buildMintMarksAvailableCodes,
} from './coinFormNormalize'
import {
  isKnownMintMarkCode,
  normalizeMintMarkCode,
  type MintMarkCodeValue,
} from '../types/coinForm'

export type ImportedMintMarkResolution =
  | { status: 'none' }
  | { status: 'single'; mintMark: MintMarkCodeValue }
  | { status: 'multiple'; codes: MintMarkCodeValue[] }

function collectUniqueMintMarkCodes(input: {
  mintMark?: string | null
  mint_mark?: string | null
  mintMarksAvailable?: string | null
  mintVariants?: Array<{ mintMarkCode?: string | null }> | null
}): MintMarkCodeValue[] {
  const codes: MintMarkCodeValue[] = []
  const seen = new Set<string>()

  const push = (raw: string | null | undefined) => {
    const normalized = normalizeMintMarkCode((raw ?? '').trim())
    if (!isKnownMintMarkCode(normalized) || seen.has(normalized)) {
      return
    }
    seen.add(normalized)
    codes.push(normalized)
  }

  push(input.mintMark)
  push(input.mint_mark)

  for (const code of buildMintMarksAvailableCodes(input.mintMarksAvailable ?? '')) {
    push(code)
  }

  for (const row of input.mintVariants ?? []) {
    push(row?.mintMarkCode)
  }

  return codes
}

/**
 * Resolve import → form `mintMark`.
 * - Exactly one explicit mark → select it
 * - Multiple marks → leave selection unchanged (caller shows warning)
 * - None → no change
 */
export function resolveImportedMintMark(input: {
  mintMark?: string | null
  mint_mark?: string | null
  mintMarksAvailable?: string | null
  mintVariants?: Array<{ mintMarkCode?: string | null }> | null
}): ImportedMintMarkResolution {
  const explicit = normalizeMintMarkCode((input.mintMark ?? input.mint_mark ?? '').trim())
  if (isKnownMintMarkCode(explicit)) {
    const others = collectUniqueMintMarkCodes({
      mintMarksAvailable: input.mintMarksAvailable,
      mintVariants: input.mintVariants,
    }).filter((code) => code !== explicit)

    if (others.length === 0) {
      return { status: 'single', mintMark: explicit }
    }

    return { status: 'multiple', codes: [explicit, ...others] }
  }

  const codes = collectUniqueMintMarkCodes(input)
  if (codes.length === 1) {
    return { status: 'single', mintMark: codes[0]! }
  }
  if (codes.length > 1) {
    return { status: 'multiple', codes }
  }
  return { status: 'none' }
}
