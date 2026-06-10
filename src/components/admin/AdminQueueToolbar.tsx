import { X } from 'lucide-react'
import type { AdminQueueDuplicateFilter, AdminQueueSortOption } from '../../lib/adminQueueFilters'

type AdminQueueToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  countryFilter: string
  onCountryFilterChange: (value: string) => void
  duplicateFilter?: AdminQueueDuplicateFilter
  onDuplicateFilterChange?: (value: AdminQueueDuplicateFilter) => void
  duplicateFilterOptions?: Array<{ value: AdminQueueDuplicateFilter; label: string }>
  sort: AdminQueueSortOption
  onSortChange: (value: AdminQueueSortOption) => void
  countries: string[]
  statusOptions: Array<{ value: string; label: string }>
  totalCount: number
  filteredCount: number
  hasActiveFilters: boolean
  onReset: () => void
}

const SORT_OPTIONS: Array<{ value: AdminQueueSortOption; label: string; requiresDuplicateData?: boolean }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title-az', label: 'Title A-Z' },
  { value: 'country-az', label: 'Country A–Z' },
  { value: 'status', label: 'Status' },
  { value: 'duplicate-risk', label: 'Duplicate risk first', requiresDuplicateData: true },
]

export function AdminQueueToolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  countryFilter,
  onCountryFilterChange,
  duplicateFilter = 'all',
  onDuplicateFilterChange,
  duplicateFilterOptions = [],
  sort,
  onSortChange,
  countries,
  statusOptions,
  totalCount,
  filteredCount,
  hasActiveFilters,
  onReset,
}: AdminQueueToolbarProps) {
  const showDuplicateFilter = Boolean(onDuplicateFilterChange && duplicateFilterOptions.length > 1)
  const sortOptions = SORT_OPTIONS.filter(
    (option) => !option.requiresDuplicateData || showDuplicateFilter,
  )

  return (
    <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/95 px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:px-5">
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(18rem,1.4fr)_repeat(4,minmax(9rem,0.5fr))]">
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, coin code, country, year, contributor…"
            className="field-control w-full"
          />
        </label>

        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
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
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
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

        {showDuplicateFilter ? (
          <label className="block min-w-0">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Duplicate
            </span>
            <select
              value={duplicateFilter}
              onChange={(event) =>
                onDuplicateFilterChange?.(event.target.value as AdminQueueDuplicateFilter)
              }
              className="field-control w-full"
            >
              {duplicateFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Sort
          </span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as AdminQueueSortOption)}
            className="field-control w-full"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          {hasActiveFilters
            ? `Showing ${filteredCount} of ${totalCount} submission${totalCount === 1 ? '' : 's'}`
            : `${totalCount} submission${totalCount === 1 ? '' : 's'}`}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-9 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3 w-3" aria-hidden />
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  )
}
