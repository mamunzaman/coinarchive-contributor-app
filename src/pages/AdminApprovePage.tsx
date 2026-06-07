import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { ApiError, approveContributor, type ApproveContributorResponse } from '../lib/api'
import { clearAuthSession, getAuthContributor } from '../lib/auth'

export function AdminApprovePage() {
  const [contributorId, setContributorId] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [approvedContributor, setApprovedContributor] = useState<
    ApproveContributorResponse['contributor'] | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldError(null)
    setApiError(null)
    setSuccessMessage(null)
    setApprovedContributor(null)

    const parsedId = Number.parseInt(contributorId.trim(), 10)
    if (!contributorId.trim() || Number.isNaN(parsedId) || parsedId < 1) {
      setFieldError('Enter a valid contributor ID.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await approveContributor(Number(parsedId))
      const contributor = response.contributor ?? null
      setApprovedContributor(contributor)

      if (contributor?.status === 'approved') {
        setSuccessMessage('Contributor approved successfully. You can now log in.')

        const storedContributor = getAuthContributor()
        if (storedContributor?.id === contributor.id) {
          clearAuthSession()
        }
      } else {
        setApiError('Approval completed but contributor status is not approved yet.')
        setApprovedContributor(null)
      }

      setContributorId('')
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message)
      } else {
        setApiError('Unable to reach the server. Check your connection and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <p className="section-label">
          Local development
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
          Approve Contributor
        </h1>
        <p className="mt-2 text-sm text-navy-muted">
          Approve a verified contributor so they can sign in.
        </p>
      </div>

      <Card>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          {successMessage && approvedContributor ? (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              <p>{successMessage}</p>
              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold uppercase tracking-wide">Contributor ID</dt>
                  <dd>{approvedContributor.id}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold uppercase tracking-wide">Status</dt>
                  <dd className="font-semibold">{approvedContributor.status}</dd>
                </div>
                {approvedContributor.email_verified !== undefined ? (
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold uppercase tracking-wide">Email verified</dt>
                    <dd>{approvedContributor.email_verified ? 'Yes' : 'No'}</dd>
                  </div>
                ) : null}
                {approvedContributor.approved_at ? (
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold uppercase tracking-wide">Approved at</dt>
                    <dd>{approvedContributor.approved_at}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {apiError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {apiError}
            </div>
          ) : null}

          <TextField
            label="Contributor ID"
            name="contributor_id"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="e.g. 3"
            value={contributorId}
            onChange={(event) => {
              setContributorId(event.target.value)
              setFieldError(null)
              setApiError(null)
              setSuccessMessage(null)
              setApprovedContributor(null)
            }}
            error={fieldError ?? undefined}
            disabled={isSubmitting}
            required
          />

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Approving…' : 'Approve Contributor'}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-navy-muted">
        <Link to="/dashboard" className="font-semibold text-primary hover:text-primary-hover">
          Back to dashboard
        </Link>
      </p>
    </div>
  )
}
