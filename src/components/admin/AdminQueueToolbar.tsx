import { X } from 'lucide-react'
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
  totalCount: number
  filteredCount: number
  hasActiveFilters: boolean
  onReset: () => void
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
  totalCount,
  filteredCount,
  hasActiveFilters,
  onReset,
}: AdminQueueToolbarProps) {
  return (
    <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:px-5">
      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.5fr))]">
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
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

        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
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

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          {hasActiveFilters
            ? `Showing ${filteredCount} of ${totalCount} submission${totalCount === 1 ? '' : 's'}`
            : `${totalCount} submission${totalCount === 1 ? '' : 's'}`}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3 w-3" aria-hidden />
            Reset filters
          </button>
        ) : null}
      </div>
    </div>
  )
}
