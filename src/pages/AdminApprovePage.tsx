import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SelectField } from '../components/ui/SelectField'
import { TextField } from '../components/ui/TextField'
import {
  ApiError,
  approveContributor,
  setContributorRole,
  type ApproveContributorResponse,
  type ContributorRole,
  type SetContributorRoleResponse,
} from '../lib/api'
import { clearAuthSession, getAuthContributor, getDefaultAppPath } from '../lib/auth'

const ROLE_OPTIONS: { value: ContributorRole; label: string }[] = [
  { value: 'contributor', label: 'Contributor' },
  { value: 'admin', label: 'Admin' },
]

export function AdminApprovePage() {
  const [contributorId, setContributorId] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [approvedContributor, setApprovedContributor] = useState<
    ApproveContributorResponse['contributor'] | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [roleContributorId, setRoleContributorId] = useState('')
  const [role, setRole] = useState<ContributorRole>('admin')
  const [roleFieldError, setRoleFieldError] = useState<string | null>(null)
  const [roleApiError, setRoleApiError] = useState<string | null>(null)
  const [roleSuccessMessage, setRoleSuccessMessage] = useState<string | null>(null)
  const [updatedContributor, setUpdatedContributor] = useState<
    SetContributorRoleResponse['contributor'] | null
  >(null)
  const [isSettingRole, setIsSettingRole] = useState(false)

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
        setSuccessMessage('Contributor approved successfully. They can now sign in.')

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

  async function handleSetRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRoleFieldError(null)
    setRoleApiError(null)
    setRoleSuccessMessage(null)
    setUpdatedContributor(null)

    const parsedId = Number.parseInt(roleContributorId.trim(), 10)
    if (!roleContributorId.trim() || Number.isNaN(parsedId) || parsedId < 1) {
      setRoleFieldError('Enter a valid contributor ID.')
      return
    }

    setIsSettingRole(true)

    try {
      const response = await setContributorRole(parsedId, role)
      const contributor = response.contributor ?? null
      setUpdatedContributor(contributor)
      setRoleSuccessMessage(
        response.message ??
          `Contributor #${parsedId} is now ${role === 'admin' ? 'an admin' : 'a contributor'}.`,
      )

      const storedContributor = getAuthContributor()
      if (storedContributor?.id === contributor?.id) {
        clearAuthSession()
      }

      setRoleContributorId('')
    } catch (error) {
      if (error instanceof ApiError) {
        setRoleApiError(error.message)
      } else {
        setRoleApiError('Unable to reach the server. Check your connection and try again.')
      }
    } finally {
      setIsSettingRole(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 text-center">
        <p className="section-label">Administration</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-navy sm:text-3xl">
          Manage Contributors
        </h1>
        <p className="mt-2 text-sm text-navy-muted">
          Approve accounts and assign admin or contributor roles.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="font-serif text-lg font-semibold text-navy">Approve contributor</h2>
          <p className="mt-1 text-sm text-navy-muted">
            Allow a verified contributor to sign in.
          </p>

          <form className="mt-5 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
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
              {isSubmitting ? 'Approving…' : 'Approve contributor'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-serif text-lg font-semibold text-navy">Set contributor role</h2>
          <p className="mt-1 text-sm text-navy-muted">
            Promote or demote a contributor. They must sign in again for role changes to apply.
          </p>

          <form className="mt-5 flex flex-col gap-5" onSubmit={handleSetRole} noValidate>
            {roleSuccessMessage && updatedContributor ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                <p>{roleSuccessMessage}</p>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold uppercase tracking-wide">Contributor ID</dt>
                    <dd>{updatedContributor.id}</dd>
                  </div>
                  {updatedContributor.role ? (
                    <div className="flex justify-between gap-4">
                      <dt className="font-semibold uppercase tracking-wide">Role</dt>
                      <dd className="font-semibold capitalize">{updatedContributor.role}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {roleApiError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {roleApiError}
              </div>
            ) : null}

            <TextField
              label="Contributor ID"
              name="role_contributor_id"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="e.g. 14"
              value={roleContributorId}
              onChange={(event) => {
                setRoleContributorId(event.target.value)
                setRoleFieldError(null)
                setRoleApiError(null)
                setRoleSuccessMessage(null)
                setUpdatedContributor(null)
              }}
              error={roleFieldError ?? undefined}
              disabled={isSettingRole}
              required
            />

            <SelectField
              label="Role"
              name="contributor_role"
              value={role}
              onChange={(event) => setRole(event.target.value as ContributorRole)}
              options={ROLE_OPTIONS}
              disabled={isSettingRole}
            />

            <Button type="submit" fullWidth disabled={isSettingRole}>
              {isSettingRole ? 'Updating…' : 'Update role'}
            </Button>
          </form>
        </Card>
      </div>

      <p className="mt-6 text-center text-sm text-navy-muted">
        <Link to={getDefaultAppPath()} className="font-semibold text-primary hover:text-primary-hover">
          Back to dashboard
        </Link>
      </p>
    </div>
  )
}
