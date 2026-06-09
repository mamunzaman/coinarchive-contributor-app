import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ApiError,
  checkCoinDuplicates,
  getMySubmission,
  getMySubmissions,
  type CoinSubmissionDetail,
  type DuplicateCheckApiMatch,
  type MySubmissionsResponse,
} from '../lib/api'
import { generateCoinCodePreview } from '../lib/coinCodePreview'
import { resolveDuplicateCheckStatus } from '../lib/duplicateCheck'
import {
  categorizeDuplicateMatches,
  findDuplicateMatches,
  getDuplicateMatchTier,
  type CategorizedDuplicateMatches,
  type DuplicateMatch,
} from '../lib/duplicateDetection'
import type { CoinFormValues } from '../types/coinForm'
import type { FormOptions } from '../types/formOptions'

const DEBOUNCE_MS = 1_200
const LIST_CACHE_TTL_MS = 60_000
const RESULT_CACHE_TTL_MS = 60_000

type UseDuplicateCheckOptions = {
  token: string | null
  values: CoinFormValues
  formOptions?: FormOptions
  excludeSubmissionId?: number
  enabled?: boolean
}

const detailCache = new Map<number, CoinSubmissionDetail>()
const resultCache = new Map<string, { fetchedAt: number; matches: DuplicateMatch[] }>()

let listCache: {
  token: string
  fetchedAt: number
  response: MySubmissionsResponse
} | null = null

const EMPTY_CATEGORIZED: CategorizedDuplicateMatches = {
  warningMatches: [],
  draftMatches: [],
  referenceMatches: [],
  allMatches: [],
}

function isValidDuplicateCheckYear(year: string): boolean {
  const trimmed = year.trim()

  if (!/^\d+$/.test(trimmed)) {
    return false
  }

  const parsed = Number.parseInt(trimmed, 10)
  const minYear = 500
  const maxYear = new Date().getFullYear() + 1

  return parsed >= minYear && parsed <= maxYear
}

function getOptionalString(values: CoinFormValues, key: string): string {
  const record = values as unknown as Record<string, unknown>
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

function getUniqueCode(values: CoinFormValues): string {
  return getOptionalString(values, 'unique_code')
}

function getCoinCode(values: CoinFormValues, formOptions?: FormOptions): string {
  const explicitCoinCode = getOptionalString(values, 'coin_code')
  if (explicitCoinCode.trim()) {
    return explicitCoinCode
  }

  return generateCoinCodePreview(
    values.country,
    values.year,
    values.denomination,
    values.coin_type,
    formOptions?.countries ?? [],
    values.released_date,
  ).coinCode
}

function getSubjectValue(values: CoinFormValues): string {
  return (
    getOptionalString(values, 'commemorative_subject') ||
    getOptionalString(values, 'coin_name') ||
    getOptionalString(values, 'theme') ||
    values.coin_theme ||
    getOptionalString(values, 'series')
  )
}

function buildDuplicateFingerprint(
  values: CoinFormValues,
  formOptions: FormOptions | undefined,
  excludeSubmissionId?: number,
): string {
  return JSON.stringify({
    excludeSubmissionId,
    title: values.title.trim().toLowerCase(),
    uniqueCode: getUniqueCode(values).trim().toLowerCase(),
    coinCode: getCoinCode(values, formOptions).trim().toLowerCase(),
    country: values.country.trim().toLowerCase(),
    year: values.year.trim(),
    denomination: values.denomination.trim().toLowerCase(),
    coinType: values.coin_type.trim().toLowerCase(),
    subject: getSubjectValue(values).trim().toLowerCase(),
  })
}

function canUseApiFallback(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status === 404 || error.status === 405)
}

function normalizeApiMatch(match: DuplicateCheckApiMatch, values: CoinFormValues): DuplicateMatch {
  return {
    id: Number(match.id),
    title: match.title,
    year: match.year ?? values.year,
    country: match.country ?? values.country,
    status: match.status,
    coinCode: match.coin_code,
    uniqueCode: match.unique_code,
    viewUrl: match.view_url ?? match.edit_link,
    matchType: match.match_type ?? 'similar',
    tier: getDuplicateMatchTier(match.status),
  }
}

async function getMySubmissionsCached(token: string): Promise<MySubmissionsResponse> {
  const now = Date.now()

  if (
    listCache &&
    listCache.token === token &&
    now - listCache.fetchedAt < LIST_CACHE_TTL_MS
  ) {
    return listCache.response
  }

  const response = await getMySubmissions(token)
  listCache = {
    token,
    fetchedAt: now,
    response,
  }

  return response
}

async function runLocalDuplicateCheck(
  token: string,
  values: CoinFormValues,
  formOptions: FormOptions | undefined,
  excludeSubmissionId?: number,
): Promise<DuplicateMatch[]> {
  const listResponse = await getMySubmissionsCached(token)
  const ids = listResponse.submissions
    .map((submission) => submission.id)
    .filter((id) => id !== excludeSubmissionId)

  const details = await Promise.all(
    ids.map(async (id) => {
      if (detailCache.has(id)) {
        return detailCache.get(id) as CoinSubmissionDetail
      }

      const response = await getMySubmission(id, token)
      detailCache.set(id, response.submission)
      return response.submission
    }),
  )

  return findDuplicateMatches(values, details, excludeSubmissionId, {
    coinCode: getCoinCode(values, formOptions),
    uniqueCode: getUniqueCode(values),
  })
}

async function runApiDuplicateCheck(
  token: string,
  values: CoinFormValues,
  formOptions: FormOptions | undefined,
  excludeSubmissionId?: number,
): Promise<DuplicateMatch[]> {
  const response = await checkCoinDuplicates(
    {
      title: values.title.trim() || undefined,
      post_title: values.title.trim() || undefined,
      unique_code: getUniqueCode(values).trim() || undefined,
      coin_code: getCoinCode(values, formOptions).trim() || undefined,
      country: values.country.trim(),
      year: values.year.trim(),
      denomination: values.denomination.trim(),
      coin_type: values.coin_type.trim(),
      commemorative_subject: getOptionalString(values, 'commemorative_subject').trim() || undefined,
      coin_theme: values.coin_theme.trim() || undefined,
      coin_name: getOptionalString(values, 'coin_name').trim() || undefined,
      series: getOptionalString(values, 'series').trim() || undefined,
      exclude_submission_id: excludeSubmissionId,
    },
    token,
  )

  return response.hasDuplicates
    ? response.matches.map((match) => normalizeApiMatch(match, values))
    : []
}

export function useDuplicateCheck({
  token,
  values,
  formOptions,
  excludeSubmissionId,
  enabled = true,
}: UseDuplicateCheckOptions) {
  const [matches, setMatches] = useState<DuplicateMatch[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [hasError, setHasError] = useState(false)
  const latestRequestRef = useRef(0)

  const canCheck = useMemo(
    () =>
      enabled &&
      Boolean(token) &&
      Boolean(values.country.trim()) &&
      Boolean(values.year.trim()) &&
      Boolean(values.denomination.trim()) &&
      Boolean(values.coin_type.trim()) &&
      isValidDuplicateCheckYear(values.year),
    [
      enabled,
      token,
      values.country,
      values.year,
      values.denomination,
      values.coin_type,
    ],
  )

  const fingerprint = useMemo(
    () => buildDuplicateFingerprint(values, formOptions, excludeSubmissionId),
    [excludeSubmissionId, formOptions, values],
  )

  const checkNow = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!canCheck || !token) {
        setMatches([])
        setIsChecking(false)
        setHasError(false)
        return []
      }

      const requestId = latestRequestRef.current + 1
      latestRequestRef.current = requestId
      const cacheKey = `${token}|${fingerprint}`
      const cached = resultCache.get(cacheKey)
      const now = Date.now()

      if (!force && cached && now - cached.fetchedAt < RESULT_CACHE_TTL_MS) {
        setMatches(cached.matches)
        setIsChecking(false)
        setHasError(false)
        return cached.matches
      }

      setIsChecking(true)
      setHasError(false)

      try {
        let nextMatches: DuplicateMatch[]

        try {
          nextMatches = await runApiDuplicateCheck(token, values, formOptions, excludeSubmissionId)
        } catch (error) {
          if (!canUseApiFallback(error)) {
            throw error
          }

          nextMatches = await runLocalDuplicateCheck(token, values, formOptions, excludeSubmissionId)
        }

        resultCache.set(cacheKey, {
          fetchedAt: Date.now(),
          matches: nextMatches,
        })

        if (latestRequestRef.current === requestId) {
          setMatches(nextMatches)
          setHasError(false)
        }

        return nextMatches
      } catch {
        if (latestRequestRef.current === requestId) {
          setMatches([])
          setHasError(true)
        }

        return []
      } finally {
        if (latestRequestRef.current === requestId) {
          setIsChecking(false)
        }
      }
    },
    [canCheck, excludeSubmissionId, fingerprint, formOptions, token, values],
  )

  useEffect(() => {
    if (!canCheck) {
      setMatches([])
      setIsChecking(false)
      setHasError(false)
      return
    }

    setIsChecking(true)
    setHasError(false)

    const timer = window.setTimeout(() => {
      void checkNow()
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [canCheck, checkNow])

  const categorized = useMemo(
    () => (matches.length > 0 ? categorizeDuplicateMatches(matches) : EMPTY_CATEGORIZED),
    [matches],
  )

  const status = resolveDuplicateCheckStatus(canCheck, isChecking, hasError, matches)

  return {
    status,
    matches,
    ...categorized,
    isChecking,
    hasError,
    checkNow,
  }
}

