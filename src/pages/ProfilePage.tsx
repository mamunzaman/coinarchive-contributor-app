import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ProfileInformationForm } from '../components/profile/ProfileInformationForm'
import { ChangePasswordForm } from '../components/profile/ChangePasswordForm'
import { ContributorStatisticsCards } from '../components/profile/ContributorStatisticsCards'
import { ProfileAttributionPreview } from '../components/profile/ProfileAttributionPreview'
import { ProfileEmailVerificationCta } from '../components/profile/ProfileEmailVerificationCta'
import { ProfilePageSkeleton } from '../components/profile/ProfilePageSkeleton'
import {
  ProfileAccountStatusCard,
  ProfileSecurityCard,
} from '../components/profile/ProfileSidebar'
import { ProfileAccountActivity } from '../components/profile/ProfileAccountActivity'
import { SaveFeedbackBanner } from '../components/ui/SaveFeedbackBanner'
import { SaveFeedbackToast } from '../components/ui/SaveFeedbackToast'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RoleBadge } from '../components/ui/RoleBadge'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ApiError, getMySubmissions } from '../lib/api'
import { formatActivityDateTime } from '../lib/format'
import { getEditableDisplayName, type ProfileUpdatePayload } from '../lib/profileFields'
import { findLatestPasswordActivityEvent } from '../lib/profileActivityUtils'
import { computeContributorStatistics } from '../lib/contributorStats'
import type { AccountActivityResponse } from '../services/profileApi'
import { updateAuthProfile } from '../services/profileApi'
import { isAuthErrorResponse } from '../types/auth'
import { useAuth } from '../hooks/useAuth'
import { useSaveFeedback } from '../hooks/useSaveFeedback'

function ProfileContributorStatsCard({
  statsError,
  isLoading,
  stats,
}: {
  statsError: string | null
  isLoading: boolean
  stats: ReturnType<typeof computeContributorStatistics>
}) {
  return (
    <Card className="profile-page__sidebar-card profile-page__stats">
      {statsError ? (
        <p role="alert" className="text-sm text-red-600">
          {statsError}
        </p>
      ) : (
        <ContributorStatisticsCards stats={stats} isLoading={isLoading} compact />
      )}
    </Card>
  )
}

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, token, logout, refreshUser, isBootstrapping } = useAuth()
  const {
    inlineRef,
    inlineFeedback,
    inlineExiting,
    toast,
    showSuccess,
    showError,
    dismissToast,
    clearInlineFeedback,
  } = useSaveFeedback()
  const role = user?.role === 'admin' ? 'admin' : 'contributor'
  const hasSession = Boolean(token && user)
  const isContributor = role === 'contributor'
  const showEmailVerificationCta = user?.email_verified === false

  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [submissions, setSubmissions] = useState<Awaited<
    ReturnType<typeof getMySubmissions>
  >['submissions']>([])
  const [activityRefreshToken, setActivityRefreshToken] = useState(0)
  const [activeSessions, setActiveSessions] = useState<number | null>(null)
  const [passwordLastChangedLabel, setPasswordLastChangedLabel] = useState<string | null>(null)

  const dateLocale = i18n.language?.startsWith('de') ? 'de-DE' : 'en-US'
  const dateFallback = t('profile.activity.notAvailable')

  const handleActivityLoaded = useCallback(
    (data: AccountActivityResponse) => {
      setActiveSessions(data.summary.active_sessions)

      const passwordEvent = findLatestPasswordActivityEvent(data.events)
      if (passwordEvent?.date) {
        setPasswordLastChangedLabel(
          t('profile.security.passwordLastChanged', {
            date: formatActivityDateTime(passwordEvent.date, dateLocale, dateFallback),
          }),
        )
      } else {
        setPasswordLastChangedLabel(null)
      }
    },
    [dateFallback, dateLocale, t],
  )

  useEffect(() => {
    if (!isContributor) {
      setIsLoadingStats(false)
      setStatsError(null)
      return
    }

    async function loadStats() {
      setIsLoadingStats(true)
      setStatsError(null)

      const activeToken = token
      if (!activeToken) {
        setStatsError(t('dashboard.sessionExpired'))
        setIsLoadingStats(false)
        return
      }

      try {
        const response = await getMySubmissions(activeToken)
        setSubmissions(response.submissions ?? [])
      } catch (err) {
        if (err instanceof ApiError) {
          setStatsError(err.message)
        } else {
          setStatsError(t('profile.statsLoadFailed'))
        }
      } finally {
        setIsLoadingStats(false)
      }
    }

    void loadStats()
  }, [isContributor, token, t])

  const contributorStats = useMemo(
    () => computeContributorStatistics(submissions),
    [submissions],
  )

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  async function handleProfileSave(payload: ProfileUpdatePayload) {
    if (!token) {
      showError(t('dashboard.sessionExpired'))
      return
    }

    setIsSavingProfile(true)
    clearInlineFeedback()

    try {
      await updateAuthProfile(token, payload)
      const refreshed = await refreshUser()
      if (isAuthErrorResponse(refreshed)) {
        showError(refreshed.message)
        return
      }

      showSuccess(t('profile.form.saveSuccess'))
    } catch (err) {
      showError(
        err instanceof ApiError ? err.message : t('profile.form.saveFailed'),
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  function handlePasswordChanged() {
    setActivityRefreshToken((count) => count + 1)
  }

  if (isBootstrapping || !user) {
    return <ProfilePageSkeleton />
  }

  const profileFirstName = user.first_name?.trim() ?? ''
  const profileLastName = user.last_name?.trim() ?? ''
  const profileDisplayName = getEditableDisplayName(
    profileFirstName,
    profileLastName,
    user.display_name,
  )

  const statsCard = isContributor ? (
    <ProfileContributorStatsCard
      statsError={statsError}
      isLoading={isLoadingStats}
      stats={contributorStats}
    />
  ) : null

  return (
    <>
      <SaveFeedbackToast toast={toast} onDismiss={dismissToast} />
      <div className="profile-page mx-auto w-full max-w-6xl">
        <header className="profile-page__header">
          <p className="section-label">{t('profile.sectionLabel')}</p>
          <Card className="profile-page__identity mt-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-2xl font-semibold text-primary"
                  aria-hidden
                >
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate font-serif text-2xl font-semibold text-navy sm:text-3xl">
                    {user.display_name}
                  </h1>
                  <p className="mt-0.5 truncate text-sm text-navy-muted">{user.email}</p>
                  <p className="mt-2 text-sm text-navy-muted">{t('profile.headerHelper')}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <StatusBadge status={user.status} />
                <RoleBadge role={role} />
              </div>
            </div>
          </Card>
        </header>

        <div className="profile-page__layout">
          <div className="profile-page__primary">
            <ProfileInformationForm
              initialFirstName={profileFirstName}
              initialLastName={profileLastName}
              initialDisplayName={profileDisplayName}
              email={user.email}
              isSaving={isSavingProfile}
              saveFeedback={
                inlineFeedback ? (
                  <SaveFeedbackBanner
                    ref={inlineRef}
                    variant={inlineFeedback.variant}
                    message={inlineFeedback.message}
                    exiting={inlineExiting}
                  />
                ) : null
              }
              onSubmit={(payload) => void handleProfileSave(payload)}
            />

            {isContributor ? (
              <ProfileAttributionPreview
                displayName={user.display_name}
                email={user.email}
              />
            ) : null}

            {showEmailVerificationCta ? (
              <ProfileEmailVerificationCta email={user.email} />
            ) : null}

            <ChangePasswordForm
              token={token}
              passwordLastChangedLabel={passwordLastChangedLabel}
              onPasswordChanged={handlePasswordChanged}
            />
          </div>

          <aside
            className="profile-page__sidebar profile-page__sidebar--desktop"
            aria-label={t('profile.sidebar.aria')}
          >
            <ProfileAccountStatusCard
              user={user}
              role={role}
              hasSession={hasSession}
              activeSessions={activeSessions}
            />
            <ProfileSecurityCard passwordLastChangedLabel={passwordLastChangedLabel} />
            {isContributor ? <div className="profile-page__stats-desktop">{statsCard}</div> : null}
          </aside>
        </div>

        <section className="profile-page__activity mt-6" aria-label={t('profile.activity.title')}>
          <ProfileAccountActivity
            token={token}
            refreshToken={activityRefreshToken}
            onActivityLoaded={handleActivityLoaded}
          />
        </section>

        {isContributor ? <div className="profile-page__stats-mobile mt-6">{statsCard}</div> : null}

        <div className="profile-page__footer mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-navy transition-all duration-200 hover:border-navy/20 hover:bg-muted"
          >
            {t('profile.backToDashboard')}
          </Link>
          <Button type="button" variant="secondary" onClick={() => void handleLogout()}>
            {t('profile.logOut')}
          </Button>
        </div>
      </div>
    </>
  )
}
