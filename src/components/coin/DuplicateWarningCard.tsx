import { AlertTriangle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatRecordStatusLabel } from '../../lib/revisionComparison'
import {
  getDuplicateMatchHref,
  isDraftDuplicateMatch,
  isWarningDuplicateMatch,
  type DuplicateMatch,
} from '../../lib/duplicateDetection'

type DuplicateWarningCardProps = {
  matches: DuplicateMatch[]
  prominent?: boolean
}

export function DuplicateWarningCard({ matches, prominent = false }: DuplicateWarningCardProps) {
  const warningMatches = matches.filter(isWarningDuplicateMatch)

  if (warningMatches.length === 0) {
    return null
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
            Possible duplicate submission found.
          </p>
          <ul className="space-y-2">
            {warningMatches.map((match) => (
              <li
                key={match.id}
                className="rounded-lg border border-amber-200/80 bg-white/70 px-3 py-2.5"
              >
                <p className="font-medium text-navy">{match.title}</p>
                <p className="mt-1 text-xs text-navy-muted">
                  #{match.id}
                  {match.status ? ` · ${formatRecordStatusLabel(match.status)}` : ''}
                  {match.year ? ` · ${match.year}` : ''}
                  {match.country ? ` · ${match.country}` : ''}
                </p>
                <Link
                  to={`/my-submissions/${match.id}`}
                  className="mt-2 inline-flex text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  Review possible match
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-900/80">
            This is a warning only — you can still submit if this is a distinct entry.
          </p>
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
