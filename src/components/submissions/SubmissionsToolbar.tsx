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
  { value: 'drafts', label: 'Drafts' },
  { value: 'published', label: 'Published' },
]

const sortOptions: { value: SubmissionSortOption; label: string }[] = [
  { value: 'recent', label: 'Recent submission' },
  { value: 'oldest', label: 'Oldest submission' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
]

const selectClass =
  'field-control !min-h-11 !py-3 !text-sm font-medium normal-case tracking-normal'

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
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label className="block min-w-0 flex-1">
          <span className="sr-only">Search submissions</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search archive by title or post ID…"
            className="field-control !text-sm"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-muted">
            Status
            <select
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(event.target.value as SubmissionStatusFilter)
              }
              className={selectClass}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-muted">
            Sort
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SubmissionSortOption)}
              className={selectClass}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-muted">View</span>
            <div
              className="inline-flex min-h-11 rounded-xl border border-border bg-page p-1"
              role="group"
              aria-label="Submission view mode"
            >
              <button
                type="button"
                aria-pressed={viewMode === 'gallery'}
                onClick={() => onViewModeChange('gallery')}
                className={[
                  'min-h-9 flex-1 rounded-lg px-4 text-sm font-semibold transition-colors',
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
                  'min-h-9 flex-1 rounded-lg px-4 text-sm font-semibold transition-colors',
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
