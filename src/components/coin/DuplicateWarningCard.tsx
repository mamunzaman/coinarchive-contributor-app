import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DuplicateMatch } from '../../lib/duplicateDetection'

type DuplicateWarningCardProps = {
  matches: DuplicateMatch[]
}

export function DuplicateWarningCard({ matches }: DuplicateWarningCardProps) {
  if (matches.length === 0) {
    return null
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="font-semibold">Possible duplicate coin found.</p>
          <ul className="space-y-2">
            {matches.map((match) => (
              <li
                key={match.id}
                className="rounded-lg border border-amber-200/80 bg-white/70 px-3 py-2.5"
              >
                <p className="font-medium text-navy">{match.title}</p>
                <p className="mt-1 text-xs text-navy-muted">
                  {match.year} · {match.country}
                </p>
                <Link
                  to={`/my-submissions/${match.id}`}
                  className="mt-2 inline-flex text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  View existing coin
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
