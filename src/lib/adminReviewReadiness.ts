import type { CoinSubmissionDetail } from './api'
import { getSubmissionDuplicateRisk } from './duplicateProtection'
import { coinFormValuesFromSubmission } from '../types/coinForm'

export type AdminReviewGuidance = {
  label: string
  detail: string
  tone: 'ready' | 'review' | 'incomplete'
}

type ChecklistState = 'pass' | 'warning' | 'fail'
type ChecklistGroup = 'Required' | 'Recommended' | 'Risk'

type ChecklistItem = {
  label: string
  state: ChecklistState
  helper: string
}

type ReadinessSummary = {
  score: number
  tone: AdminReviewGuidance['tone']
  guidance: AdminReviewGuidance
  groups: Array<{ title: ChecklistGroup; items: ChecklistItem[] }>
  duplicateMessage: string
  duplicateTone: 'red' | 'amber' | 'green'
}

function hasText(value: string | number | undefined | null): boolean {
  return String(value ?? '').trim().length > 0
}

function hasMintData(submission: CoinSubmissionDetail): boolean {
  const values = coinFormValuesFromSubmission(submission)
  if (values.hasMintVariants) {
    return values.mintVariants.some(
      (row) => row.mintMarkCode.trim() || row.mintMintage.trim() || row.mintNotes.trim(),
    )
  }
  return Boolean(values.singleMintMark.trim() || values.mintMarksAvailable.trim())
}

function getReadinessTone(score: number): AdminReviewGuidance['tone'] {
  if (score >= 90) return 'ready'
  if (score >= 70) return 'review'
  return 'incomplete'
}

function buildItem(label: string, ready: boolean, readyText: string, missingText: string): ChecklistItem {
  return {
    label,
    state: ready ? 'pass' : 'fail',
    helper: ready ? readyText : missingText,
  }
}

export function getAdminReviewReadiness(submission: CoinSubmissionDetail): ReadinessSummary {
  const values = coinFormValuesFromSubmission(submission)
  const duplicateRisk = getSubmissionDuplicateRisk(submission)
  const hasObverse = Boolean(submission.images.obverse?.url)
  const hasReverse = Boolean(submission.images.reverse?.url)
  const hasGallery = (submission.images.gallery?.length ?? 0) > 0
  const hasDescription = Boolean(
    values.short_description.trim() ||
      values.coin_obverse_description.trim() ||
      values.coin_reverse_description.trim() ||
      values.coin_historical_background.trim(),
  )
  const hasCollectorNotes = Boolean(values.coin_collector_notes.trim())
  const mintReady = hasMintData(submission)

  const required: ChecklistItem[] = [
    buildItem('Title', hasText(values.title), 'Ready', 'Missing title'),
    buildItem('Country', hasText(values.country), 'Ready', 'Missing country'),
    buildItem('Year', hasText(values.year), 'Ready', 'Missing year'),
    buildItem('Denomination', hasText(values.denomination), 'Ready', 'Missing denomination'),
    buildItem('Obverse image', hasObverse, 'Ready', 'Missing obverse image'),
    buildItem('Release date', hasText(values.released_date), 'Ready', 'Missing release date'),
  ]

  const recommended: ChecklistItem[] = [
    {
      label: 'Reverse image',
      state: hasReverse ? 'pass' : 'warning',
      helper: hasReverse ? 'Ready' : 'Missing reverse image',
    },
    {
      label: 'Description',
      state: hasDescription ? 'pass' : 'warning',
      helper: hasDescription ? 'Ready' : 'Add description before approval',
    },
    {
      label: 'Mint data',
      state: mintReady ? 'pass' : 'warning',
      helper: mintReady ? 'Ready' : 'Mint data is incomplete',
    },
    {
      label: 'Gallery images',
      state: hasGallery ? 'pass' : 'warning',
      helper: hasGallery ? 'Ready' : 'No gallery images',
    },
    {
      label: 'Collector notes',
      state: hasCollectorNotes ? 'pass' : 'warning',
      helper: hasCollectorNotes ? 'Ready' : 'No collector notes',
    },
  ]

  const missingRequired = required.filter((item) => item.state === 'fail').length
  const risk: ChecklistItem[] = [
    {
      label: 'Exact duplicate',
      state: duplicateRisk.level === 'exact' ? 'fail' : 'pass',
      helper: duplicateRisk.level === 'exact' ? 'Exact duplicate risk detected' : 'No exact duplicate signal',
    },
    {
      label: 'Similar duplicate',
      state: duplicateRisk.level === 'similar' ? 'warning' : 'pass',
      helper: duplicateRisk.level === 'similar' ? 'Review before approval' : 'No similar duplicate signal',
    },
    {
      label: 'Missing critical data',
      state: missingRequired > 0 ? 'fail' : 'pass',
      helper:
        missingRequired > 0
          ? `${missingRequired} required item${missingRequired === 1 ? '' : 's'} missing`
          : 'Required data present',
    },
  ]

  const requiredScore = (required.filter((item) => item.state === 'pass').length / required.length) * 60
  const recommendedScore = (recommended.filter((item) => item.state === 'pass').length / recommended.length) * 25
  const riskScore =
    duplicateRisk.level === 'exact' || missingRequired > 0
      ? 0
      : duplicateRisk.level === 'similar'
        ? 7
        : 15
  const score = Math.round(requiredScore + recommendedScore + riskScore)
  const tone = getReadinessTone(score)
  const guidance =
    missingRequired > 0
      ? {
          label: 'Missing required fields',
          detail: 'Approval is still available, but required data should be fixed first.',
          tone: 'incomplete' as const,
        }
      : duplicateRisk.level === 'exact' || duplicateRisk.level === 'similar' || score < 90
        ? {
            label: 'Review recommended',
            detail: 'Compare risk signals and missing recommended fields before approving.',
            tone: 'review' as const,
          }
        : {
            label: 'Ready to approve',
            detail: 'Required data is present and no blocking review signals are visible.',
            tone: 'ready' as const,
          }

  const duplicateMessage =
    duplicateRisk.level === 'exact'
      ? 'Exact duplicate risk detected. Approval is not recommended.'
      : duplicateRisk.level === 'similar'
        ? 'Similar coin exists. Compare before approval.'
        : duplicateRisk.level === 'none'
          ? 'No known duplicate risk.'
          : 'Duplicate risk data is not available.'

  return {
    score,
    tone,
    guidance,
    duplicateMessage,
    duplicateTone:
      duplicateRisk.level === 'exact' ? 'red' : duplicateRisk.level === 'similar' ? 'amber' : 'green',
    groups: [
      { title: 'Required', items: required },
      { title: 'Recommended', items: recommended },
      { title: 'Risk', items: risk },
    ],
  }
}
