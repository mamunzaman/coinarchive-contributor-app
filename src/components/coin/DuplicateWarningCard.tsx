import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DuplicateCheckStatus } from '../../lib/duplicateCheck'
import { formatRecordStatusLabel } from '../../lib/revisionComparison'
import {
  getDuplicateMatchHref,
  isDraftDuplicateMatch,
  isWarningDuplicateMatch,
  type DuplicateMatch,
} from '../../lib/duplicateDetection'

type DuplicateWarningCardProps = {
  matches: DuplicateMatch[]
  status?: DuplicateCheckStatus
  prominent?: boolean
}

function getMatchTypeLabel(match: DuplicateMatch): string {
  switch (match.matchType) {
    case 'exact_unique_code':
      return 'Exact Unique Code Match'
    case 'exact_coin_code':
      return 'Exact Coin Code Match'
    default:
      return 'Similar Coin Match'
  }
}

function getMatchTypeClasses(match: DuplicateMatch): string {
  switch (match.matchType) {
    case 'exact_unique_code':
      return 'bg-red-50 text-red-800 ring-red-200'
    case 'exact_coin_code':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-200'
  }
}

function MatchLink({ match }: { match: DuplicateMatch }) {
  const href = getDuplicateMatchHref(match)

  if (/^https?:\/\//i.test(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex text-xs font-semibold text-primary hover:text-primary-hover"
      >
        View Existing Coin
      </a>
    )
  }

  return (
    <Link
      to={href}
      className="inline-flex text-xs font-semibold text-primary hover:text-primary-hover"
    >
      View Existing Coin
    </Link>
  )
}

export function DuplicateWarningCard({
  matches,
  status = 'clear',
  prominent = false,
}: DuplicateWarningCardProps) {
  const warningMatches = matches.filter(isWarningDuplicateMatch)

  if (
    status !== 'checking' &&
    status !== 'clear' &&
    status !== 'error' &&
    warningMatches.length === 0
  ) {
    return null
  }

  if (status === 'checking') {
    return (
      <div
        role="status"
        className="rounded-lg border border-cyan-200/80 bg-cyan-50/60 px-3 py-2 text-xs text-cyan-950"
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-700" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">Checking coin uniqueness...</p>
            <p className="text-[11px] text-cyan-900/75">
              Comparing with existing archive records.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'clear') {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-200/70 bg-emerald-50/50 px-3 py-2 text-xs text-emerald-950"
      >
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">No duplicate found</p>
            <p className="text-[11px] text-emerald-900/75">Exact code matches were not found.</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        role="status"
        className="rounded-lg border border-amber-200/90 bg-amber-50/70 px-3 py-2 text-xs text-amber-950"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">Duplicate check unavailable</p>
            <p className="text-[11px] text-amber-900/75">
              You can still submit. WordPress will run the final check.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      className={[
        'rounded-xl border border-amber-200 bg-amber-50 text-amber-950',
        prominent
          ? 'px-5 py-5 text-base shadow-[var(--shadow-card)] ring-1 ring-amber-300/40'
          : 'px-4 py-4 text-sm',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={[
            'mt-0.5 shrink-0 text-amber-700',
            prominent ? 'h-6 w-6' : 'h-5 w-5',
          ].join(' ')}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-3">
          <p className={prominent ? 'text-lg font-semibold' : 'font-semibold'}>
            Potential Duplicate Found
          </p>
          <p className="text-sm text-amber-900/85">This coin may already exist in CoinArchive.</p>
          <ul className="space-y-2">
            {warningMatches.map((match) => (
              <li
                key={match.id}
                className="rounded-lg border border-amber-200/80 bg-white/70 px-3 py-2.5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <span
                      className={[
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                        getMatchTypeClasses(match),
                      ].join(' ')}
                    >
                      {getMatchTypeLabel(match)}
                    </span>
                    <p className="mt-2 font-medium text-navy">{match.title}</p>
                    <dl className="mt-1 grid gap-x-3 gap-y-1 text-xs text-navy-muted sm:grid-cols-2">
                      {match.coinCode ? (
                        <div>
                          <dt className="sr-only">Coin code</dt>
                          <dd>Code: {match.coinCode}</dd>
                        </div>
                      ) : null}
                      {match.status ? (
                        <div>
                          <dt className="sr-only">Status</dt>
                          <dd>Status: {formatRecordStatusLabel(match.status)}</dd>
                        </div>
                      ) : null}
                      {match.country ? (
                        <div>
                          <dt className="sr-only">Country</dt>
                          <dd>Country: {match.country}</dd>
                        </div>
                      ) : null}
                      {match.year ? (
                        <div>
                          <dt className="sr-only">Year</dt>
                          <dd>Year: {match.year}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                  <div className="shrink-0 sm:pt-1">
                    <MatchLink match={match} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-amber-900/80">
              This is a warning only. WordPress review remains the final authority.
            </p>
            <button
              type="submit"
              className="inline-flex justify-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950 shadow-sm transition-colors hover:bg-amber-100"
            >
              Submit Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type DuplicateDraftInfoCardProps = {
  matches: DuplicateMatch[]
}

export function DuplicateDraftInfoCard({ matches }: DuplicateDraftInfoCardProps) {
  const draftMatches = matches.filter(isDraftDuplicateMatch)

  if (draftMatches.length === 0) {
    return null
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-slate-200/90 bg-slate-50/90 px-4 py-4 text-sm text-slate-800"
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="font-semibold text-navy">
            You already have an unfinished draft that may be the same coin.
          </p>
          <ul className="space-y-2">
            {draftMatches.map((match) => (
              <li
                key={match.id}
                className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2.5"
              >
                <p className="font-medium text-navy">{match.title}</p>
                <p className="mt-1 text-xs text-navy-muted">
                  #{match.id}
                  {match.year ? ` · ${match.year}` : ''}
                  {match.country ? ` · ${match.country}` : ''}
                </p>
                <Link
                  to={getDuplicateMatchHref(match)}
                  className="mt-2 inline-flex text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  Continue draft
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
