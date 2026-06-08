import type { TaxonomyOption } from '../types/formOptions'

function normalizeCoinCodePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function resolveCountryCode(country: string, countries: TaxonomyOption[]): string {
  const trimmed = country.trim()
  if (!trimmed) {
    return ''
  }

  const match = countries.find((option) => option.name === trimmed)
  if (match?.slug) {
    const slugCode = match.slug.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (slugCode.length >= 2 && slugCode.length <= 4) {
      return slugCode
    }
  }

  const normalized = normalizeCoinCodePart(trimmed)
  return normalized.slice(0, 3)
}

export function generateCoinCodePreview(
  country: string,
  year: string,
  denomination: string,
  coinType: string,
  countries: TaxonomyOption[] = [],
): string {
  const countryCode = resolveCountryCode(country, countries)
  const yearPart = Number.parseInt(year, 10)
  const valuePart = normalizeCoinCodePart(denomination)
  const typePart = normalizeCoinCodePart(coinType)

  if (!countryCode || !yearPart || yearPart <= 0 || !valuePart || !typePart) {
    return ''
  }

  return `${countryCode}-${yearPart}-${valuePart}-${typePart}`
}
