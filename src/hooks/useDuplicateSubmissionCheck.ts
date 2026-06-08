import { useEffect, useMemo, useState } from 'react'
import { getMySubmission, getMySubmissions, type CoinSubmissionDetail } from '../lib/api'
import { findDuplicateMatches, type DuplicateMatch } from '../lib/duplicateDetection'
import type { CoinFormValues } from '../types/coinForm'

type UseDuplicateSubmissionCheckOptions = {
  token: string | null
  values: Pick<CoinFormValues, 'country' | 'year' | 'denomination' | 'coin_type'>
  excludeSubmissionId?: number
  enabled?: boolean
}

const detailCache = new Map<number, CoinSubmissionDetail>()

export function useDuplicateSubmissionCheck({
  token,
  values,
  excludeSubmissionId,
  enabled = true,
}: UseDuplicateSubmissionCheckOptions) {
  const [matches, setMatches] = useState<DuplicateMatch[]>([])
  const [isChecking, setIsChecking] = useState(false)

  const canCheck = useMemo(
    () =>
      enabled &&
      Boolean(token) &&
      Boolean(values.country.trim()) &&
      Boolean(values.year.trim()) &&
      Boolean(values.denomination.trim()) &&
      Boolean(values.coin_type.trim()),
    [
      enabled,
      token,
      values.country,
      values.year,
      values.denomination,
      values.coin_type,
    ],
  )

  useEffect(() => {
    if (!canCheck || !token) {
      setMatches([])
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        setIsChecking(true)

        try {
          const listResponse = await getMySubmissions(token)
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

          if (!cancelled) {
            setMatches(findDuplicateMatches(values, details, excludeSubmissionId))
          }
        } catch {
          if (!cancelled) {
            setMatches([])
          }
        } finally {
          if (!cancelled) {
            setIsChecking(false)
          }
        }
      })()
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    canCheck,
    excludeSubmissionId,
    token,
    values.country,
    values.year,
    values.denomination,
    values.coin_type,
  ])

  return { matches, isChecking }
}
