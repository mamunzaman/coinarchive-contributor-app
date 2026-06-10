import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AdminQueueBulkBar } from '../../components/admin/AdminQueueBulkBar'
import { AdminQueueFilterCards } from '../../components/admin/AdminQueueFilterCards'
import { AdminQueueTableSkeleton } from '../../components/admin/AdminQueueTableSkeleton'
import { AdminQueueToolbar } from '../../components/admin/AdminQueueToolbar'
import { AdminRejectDialog } from '../../components/admin/AdminRejectDialog'
import { AdminSubmissionQueueMobileCards } from '../../components/admin/AdminSubmissionQueueMobileCards'
import { AdminSubmissionQueueTable } from '../../components/admin/AdminSubmissionQueueTable'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import {
  approveAdminSubmission,
  bulkApproveAdminSubmissions,
  bulkRejectAdminSubmissions,
  formatAdminEndpointError,
  getAdminSubmissions,
  rejectAdminSubmission,
  type AdminSubmissionListItem,
} from '../../lib/adminApi'
import {
  computeAdminQueueCounts,
  filterAdminQueueSubmissions,
  getAdminQueueDuplicateRiskCount,
  getAdminQueueDuplicateLevels,
  getAdminQueueCountries,
  hasAdminQueueDuplicateRiskData,
  isPendingAdminSubmission,
  sortAdminQueueSubmissions,
  type AdminQueueDuplicateFilter,
  type AdminQueueSortOption,
  type AdminQueueStatusFilter,
} from '../../lib/adminQueueFilters'
import { useAuth } from '../../hooks/useAuth'
import { ApiError } from '../../lib/api'

const STATUS_DROPDOWN_OPTIONS: Array<{ value: AdminQueueStatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'needs_revision', label: 'Needs revision' },
  { value: 'draft', label: 'Draft' },
]

type RejectMode = 'single' | 'bulk'

export function AdminSubmissionsPage() {
  const { token } = useAuth()
  const [submissions, setSubmissions] = useState<AdminSubmissionListItem[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminQueueStatusFilter>('all')
  const [countryFilter, setCountryFilter] = useState('')
  const [duplicateFilter, setDuplicateFilter] = useState<AdminQueueDuplicateFilter>('all')
  const [sort, setSort] = useState<AdminQueueSortOption>('newest')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [actionSubmissionId, setActionSubmissionId] = useState<number | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [rejectMode, setRejectMode] = useState<RejectMode>('single')
  const [rejectTargetIds, setRejectTargetIds] = useState<number[]>([])

  async function loadSubmissions(options?: { refresh?: boolean }) {
    if (options?.refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    setNotice(null)

    if (!token) {
      setError('Your session has expired. Please sign in again.')
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }

    try {
      const result = await getAdminSubmissions(token)
      setSubmissions(result.response.submissions)

      if (result.meta.usedDevFallback) {
        setNotice(formatAdminEndpointError('/admin/submissions', new ApiError('', 404)))
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(formatAdminEndpointError('/admin/submissions', err))
      } else {
        setError('Unable to reach the server. Check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void loadSubmissions()
  }, [token])

  const hasActiveFilters =
    query.trim() !== '' ||
    statusFilter !== 'all' ||
    countryFilter !== '' ||
    duplicateFilter !== 'all' ||
    sort !== 'newest'

  function resetFilters() {
    setQuery('')
    setStatusFilter('all')
    setCountryFilter('')
    setDuplicateFilter('all')
    setSort('newest')
  }

  const counts = useMemo(() => computeAdminQueueCounts(submissions), [submissions])
  const duplicateRiskCount = useMemo(() => getAdminQueueDuplicateRiskCount(submissions), [submissions])
  const countries = useMemo(() => getAdminQueueCountries(submissions), [submissions])
  const hasDuplicateRiskData = useMemo(() => hasAdminQueueDuplicateRiskData(submissions), [submissions])
  const duplicateFilterOptions = useMemo(() => {
    if (!hasDuplicateRiskData) {
      return []
    }

    const levels = getAdminQueueDuplicateLevels(submissions)
    return [
      { value: 'all' as const, label: 'All duplicate states' },
      { value: 'risk' as const, label: 'Has duplicate risk' },
      ...(levels.has('exact') ? [{ value: 'exact' as const, label: 'Exact duplicate' }] : []),
      ...(levels.has('similar') ? [{ value: 'similar' as const, label: 'Similar match' }] : []),
      ...(levels.has('none') ? [{ value: 'none' as const, label: 'No risk / checked clean' }] : []),
    ]
  }, [hasDuplicateRiskData, submissions])

  useEffect(() => {
    if (!hasDuplicateRiskData && duplicateFilter !== 'all') {
      setDuplicateFilter('all')
    }
    if (
      hasDuplicateRiskData &&
      duplicateFilter !== 'all' &&
      !duplicateFilterOptions.some((option) => option.value === duplicateFilter)
    ) {
      setDuplicateFilter('all')
    }
    if (!hasDuplicateRiskData && sort === 'duplicate-risk') {
      setSort('newest')
    }
  }, [duplicateFilter, duplicateFilterOptions, hasDuplicateRiskData, sort])

  const filteredSubmissions = useMemo(() => {
    const filtered = filterAdminQueueSubmissions(submissions, {
      query,
      statusFilter,
      countryFilter,
      duplicateFilter,
    })

    return sortAdminQueueSubmissions(filtered, sort)
  }, [countryFilter, duplicateFilter, query, sort, statusFilter, submissions])

  const pendingSelectedCount = useMemo(
    () =>
      filteredSubmissions.filter(
        (submission) => selectedIds.has(submission.id) && isPendingAdminSubmission(submission),
      ).length,
    [filteredSubmissions, selectedIds],
  )

  const pendingSelectedIds = useMemo(
    () =>
      filteredSubmissions
        .filter((submission) => selectedIds.has(submission.id) && isPendingAdminSubmission(submission))
        .map((submission) => submission.id),
    [filteredSubmissions, selectedIds],
  )

  function toggleRow(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll(ids: number[]) {
    setSelectedIds((current) => {
      const allSelected = ids.every((id) => current.has(id))
      if (allSelected) {
        return new Set()
      }
      return new Set(ids)
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function handleQuickApprove(submission: AdminSubmissionListItem) {
    if (!token) {
      setActionError('Your session has expired. Please sign in again.')
      return
    }

    setActionSubmissionId(submission.id)
    setActionError(null)
    setActionMessage(null)

    try {
      await approveAdminSubmission(submission.id, token)
      setActionMessage(`Approved “${submission.title}”.`)
      clearSelection()
      await loadSubmissions({ refresh: true })
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Unable to approve submission.')
    } finally {
      setActionSubmissionId(null)
    }
  }

  function openRejectDialog(ids: number[], mode: RejectMode) {
    setRejectTargetIds(ids)
    setRejectMode(mode)
    setRejectReason('')
    setRejectError(null)
    setShowRejectDialog(true)
  }

  function closeRejectDialog() {
    if (isBulkProcessing || actionSubmissionId !== null) {
      return
    }

    setShowRejectDialog(false)
    setRejectError(null)
  }

  async function handleRejectConfirm() {
    if (!token || rejectTargetIds.length === 0 || !rejectReason.trim()) {
      return
    }

    setRejectError(null)
    setActionError(null)
    setActionMessage(null)

    if (rejectMode === 'single' && rejectTargetIds.length === 1) {
      setActionSubmissionId(rejectTargetIds[0])
    } else {
      setIsBulkProcessing(true)
    }

    try {
      if (rejectTargetIds.length === 1) {
        await rejectAdminSubmission(rejectTargetIds[0], rejectReason.trim(), token)
        setActionMessage('Submission rejected.')
      } else {
        const result = await bulkRejectAdminSubmissions(rejectTargetIds, rejectReason.trim(), token)
        if (result.failed.length === 0) {
          setActionMessage(`Rejected ${result.succeeded.length} submissions.`)
        } else if (result.succeeded.length === 0) {
          setActionError(`All ${result.failed.length} rejections failed.`)
        } else {
          setActionError(
            `Rejected ${result.succeeded.length}; ${result.failed.length} failed.`,
          )
        }
      }

      setShowRejectDialog(false)
      clearSelection()
      await loadSubmissions({ refresh: true })
    } catch (err) {
      setRejectError(err instanceof ApiError ? err.message : 'Unable to reject submission.')
    } finally {
      setActionSubmissionId(null)
      setIsBulkProcessing(false)
    }
  }

  async function handleBulkApprove() {
    if (!token || pendingSelectedIds.length === 0) {
      return
    }

    setIsBulkProcessing(true)
    setActionError(null)
    setActionMessage(null)

    try {
      const result = await bulkApproveAdminSubmissions(pendingSelectedIds, token)
      if (result.failed.length === 0) {
        setActionMessage(`Approved ${result.succeeded.length} submissions.`)
      } else if (result.succeeded.length === 0) {
        setActionError(`All ${result.failed.length} approvals failed.`)
      } else {
        setActionError(`Approved ${result.succeeded.length}; ${result.failed.length} failed.`)
      }

      clearSelection()
      await loadSubmissions({ refresh: true })
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Bulk approval failed.')
    } finally {
      setIsBulkProcessing(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <Card className="!overflow-hidden !p-0">
        <div className="border-b border-border/60 bg-gradient-to-br from-white to-page/80 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Admin workspace
              </p>
              <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
                Submission Queue
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-navy-muted">
                Review contributor submissions before publishing to CoinArchive.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={isLoading || isRefreshing}
              onClick={() => void loadSubmissions({ refresh: true })}
              className="!min-h-10 shrink-0"
            >
              <RefreshCw
                className={['mr-2 h-4 w-4', isRefreshing ? 'animate-spin' : ''].filter(Boolean).join(' ')}
                aria-hidden
              />
              {isRefreshing ? 'Refreshing…' : 'Refresh queue'}
            </Button>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <AdminQueueFilterCards
            counts={counts}
            duplicateRiskCount={duplicateRiskCount}
            duplicateRiskActive={duplicateFilter === 'risk'}
            onDuplicateRiskFilter={
              hasDuplicateRiskData && duplicateRiskCount > 0 ? () => setDuplicateFilter('risk') : undefined
            }
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        </div>
      </Card>

      {notice ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {notice}
        </div>
      ) : null}

      {actionMessage ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </div>
      ) : null}

      <div className="sticky top-3 z-20">
        <AdminQueueToolbar
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => setStatusFilter(value as AdminQueueStatusFilter)}
          countryFilter={countryFilter}
          onCountryFilterChange={setCountryFilter}
          duplicateFilter={duplicateFilter}
          onDuplicateFilterChange={hasDuplicateRiskData ? setDuplicateFilter : undefined}
          duplicateFilterOptions={duplicateFilterOptions}
          sort={sort}
          onSortChange={setSort}
          countries={countries}
          statusOptions={STATUS_DROPDOWN_OPTIONS}
          totalCount={submissions.length}
          filteredCount={filteredSubmissions.length}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
        />
      </div>

      <AdminQueueBulkBar
        selectedCount={selectedIds.size}
        pendingSelectedCount={pendingSelectedCount}
        isProcessing={isBulkProcessing}
        onApprove={() => void handleBulkApprove()}
        onReject={() => openRejectDialog(pendingSelectedIds, 'bulk')}
        onClear={clearSelection}
      />

      {error ? (
        <Card className="!p-5">
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void loadSubmissions()}>
            Try again
          </Button>
        </Card>
      ) : null}

      {isLoading ? <AdminQueueTableSkeleton /> : null}

      {!isLoading && !error ? (
        <>
          <AdminSubmissionQueueTable
            submissions={filteredSubmissions}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onQuickApprove={(submission) => void handleQuickApprove(submission)}
            onQuickReject={(submission) => openRejectDialog([submission.id], 'single')}
            actionSubmissionId={actionSubmissionId}
            emptyMessage="No submissions match this filter."
          />
          <AdminSubmissionQueueMobileCards
            submissions={filteredSubmissions}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onQuickApprove={(submission) => void handleQuickApprove(submission)}
            onQuickReject={(submission) => openRejectDialog([submission.id], 'single')}
            actionSubmissionId={actionSubmissionId}
            emptyMessage="No submissions match this filter."
          />
        </>
      ) : null}

      <AdminRejectDialog
        open={showRejectDialog}
        reason={rejectReason}
        isSubmitting={isBulkProcessing || actionSubmissionId !== null}
        error={rejectError}
        onReasonChange={setRejectReason}
        onCancel={closeRejectDialog}
        onConfirm={() => void handleRejectConfirm()}
      />
    </div>
  )
}
