import type { AdminQueueSortOption } from '../../lib/adminQueueFilters'

type AdminQueueToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  countryFilter: string
  onCountryFilterChange: (value: string) => void
  sort: AdminQueueSortOption
  onSortChange: (value: AdminQueueSortOption) => void
  countries: string[]
  statusOptions: Array<{ value: string; label: string }>
}

const SORT_OPTIONS: Array<{ value: AdminQueueSortOption; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'contributor-az', label: 'Contributor A–Z' },
  { value: 'country-az', label: 'Country A–Z' },
  { value: 'status', label: 'Status' },
]

export function AdminQueueToolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  countryFilter,
  onCountryFilterChange,
  sort,
  onSortChange,
  countries,
  statusOptions,
}: AdminQueueToolbarProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.55fr))] lg:items-end">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-muted">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, contributor, country, year, coin code…"
            className="field-control w-full"
          />
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-muted">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="field-control w-full"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-muted">
            Country
          </span>
          <select
            value={countryFilter}
            onChange={(event) => onCountryFilterChange(event.target.value)}
            className="field-control w-full"
            disabled={countries.length === 0}
          >
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-muted">
            Sort
          </span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as AdminQueueSortOption)}
            className="field-control w-full"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
