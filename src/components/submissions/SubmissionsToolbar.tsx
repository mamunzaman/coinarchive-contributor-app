import type {
  SubmissionSortOption,
  SubmissionStatusFilter,
  SubmissionViewMode,
} from '../../lib/submissionListUtils'

type SubmissionsToolbarProps = {
  query: string
  statusFilter: SubmissionStatusFilter
  sort: SubmissionSortOption
  viewMode: SubmissionViewMode
  resultCount: number
  totalCount: number
  onQueryChange: (value: string) => void
  onStatusFilterChange: (value: SubmissionStatusFilter) => void
  onSortChange: (value: SubmissionSortOption) => void
  onViewModeChange: (value: SubmissionViewMode) => void
}

const statusOptions: { value: SubmissionStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending review' },
  { value: 'published', label: 'Published' },
]

const sortOptions: { value: SubmissionSortOption; label: string }[] = [
  { value: 'recent', label: 'Recent submission' },
  { value: 'oldest', label: 'Oldest submission' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
]

export function SubmissionsToolbar({
  query,
  statusFilter,
  sort,
  viewMode,
  resultCount,
  totalCount,
  onQueryChange,
  onStatusFilterChange,
  onSortChange,
  onViewModeChange,
}: SubmissionsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <label className="block min-w-0 flex-1">
          <span className="sr-only">Search submissions</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search archive by title or post ID…"
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-navy outline-none transition-colors placeholder:text-navy-muted/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex min-w-[10rem] flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-muted">
            Status
            <select
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(event.target.value as SubmissionStatusFilter)
              }
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-navy outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[10rem] flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-muted">
            Sort
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SubmissionSortOption)}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-navy outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-muted">
              View
            </span>
            <div
              className="inline-flex rounded-xl border border-border bg-muted/40 p-1"
              role="group"
              aria-label="Submission view mode"
            >
              <button
                type="button"
                aria-pressed={viewMode === 'gallery'}
                onClick={() => onViewModeChange('gallery')}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  viewMode === 'gallery'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-navy-muted hover:text-navy',
                ].join(' ')}
              >
                Gallery
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'table'}
                onClick={() => onViewModeChange('table')}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  viewMode === 'table'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-navy-muted hover:text-navy',
                ].join(' ')}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-navy-muted">
        Showing {resultCount} of {totalCount} specimen{totalCount === 1 ? '' : 's'}
      </p>
    </div>
  )
}
