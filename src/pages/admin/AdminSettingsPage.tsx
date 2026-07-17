import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, RefreshCw, Send } from 'lucide-react'
import { SaveFeedbackBanner } from '../../components/ui/SaveFeedbackBanner'
import { SaveFeedbackToast } from '../../components/ui/SaveFeedbackToast'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from '../../hooks/useAuth'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import { ApiError } from '../../lib/api'
import { runAfterCommit } from '../../lib/runAfterCommit'
import {
  getAdminEmailSettings,
  sendAdminEmailTest,
  updateAdminEmailSettings,
} from '../../services/adminSettingsApi'
import {
  DEFAULT_ADMIN_EMAIL_SETTINGS,
  EMAIL_NOTIFICATION_FLAG_KEYS,
  type AdminEmailSettings,
  type AdminEmailNotificationFlags,
  type EmailDeliveryStatus,
} from '../../types/adminEmailSettings'

type FieldErrors = {
  adminRecipientEmail?: string
  senderName?: string
  replyToEmail?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

function deliveryStatusClass(status: EmailDeliveryStatus): string {
  switch (status) {
    case 'configured':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900'
    case 'test_successful':
      return 'border-primary/25 bg-primary/5 text-primary-hover'
    case 'test_failed':
      return 'border-red-200 bg-red-50 text-red-800'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-950'
  }
}

type SettingsSwitchProps = {
  id: string
  label: string
  checked: boolean
  disabled?: boolean
  activeLabel: string
  inactiveLabel: string
  onChange: (checked: boolean) => void
  showLabel?: boolean
}

function SettingsSwitch({
  id,
  label,
  checked,
  disabled = false,
  activeLabel,
  inactiveLabel,
  onChange,
  showLabel = true,
}: SettingsSwitchProps) {
  const statusLabel = checked ? activeLabel : inactiveLabel

  return (
    <div
      className={[
        'flex min-w-0 items-center gap-3',
        showLabel ? 'justify-between' : 'justify-end',
        disabled ? 'cursor-not-allowed' : '',
      ].join(' ')}
    >
      {showLabel ? (
        <label
          htmlFor={id}
          className={[
            'min-w-0 flex-1 text-sm font-medium leading-snug text-navy',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
        >
          {label}
        </label>
      ) : null}
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={`${label}: ${statusLabel}`}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={[
            'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
            checked ? 'bg-primary' : 'bg-slate-300',
            disabled ? 'opacity-70' : 'cursor-pointer',
          ].join(' ')}
        >
          <span
            aria-hidden
            className={[
              'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
              checked ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
        <span
          className={[
            'min-w-[4.25rem] text-sm font-medium',
            checked ? 'text-navy' : 'text-navy-muted',
            disabled ? 'opacity-80' : '',
          ].join(' ')}
          aria-hidden
        >
          {statusLabel}
        </span>
      </div>
    </div>
  )
}

export function AdminSettingsPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
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

  const [settings, setSettings] = useState<AdminEmailSettings>(DEFAULT_ADMIN_EMAIL_SETTINGS)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [usedMock, setUsedMock] = useState(false)

  const notificationsActive = settings.emailNotificationsEnabled
  const busy = isLoading || isSaving || isTesting

  const notificationFlags = useMemo(
    () =>
      EMAIL_NOTIFICATION_FLAG_KEYS.map((key) => ({
        key,
        label: t(`admin.settings.email.events.${key}`),
      })),
    [t],
  )

  async function loadSettings() {
    clearInlineFeedback()
    setIsLoading(true)
    setLoadError(null)

    if (!token) {
      setLoadError(t('admin.settings.sessionExpired'))
      setIsLoading(false)
      return
    }

    try {
      const result = await getAdminEmailSettings(token)
      runAfterCommit(() => {
        setSettings(result.settings)
        setUsedMock(result.usedMock)
        setFieldErrors({})
      })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('admin.settings.loadError')
      runAfterCommit(() => setLoadError(message))
    } finally {
      runAfterCommit(() => setIsLoading(false))
    }
  }

  useEffect(() => {
    void loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount / token change
  }, [token])

  function updateSetting<K extends keyof AdminEmailSettings>(key: K, value: AdminEmailSettings[K]) {
    setSettings((previous) => ({ ...previous, [key]: value }))
  }

  function handleMasterNotificationsChange(enabled: boolean) {
    setSettings((previous) => {
      const nextFlags = Object.fromEntries(
        EMAIL_NOTIFICATION_FLAG_KEYS.map((key) => [key, enabled]),
      ) as AdminEmailNotificationFlags

      return {
        ...previous,
        emailNotificationsEnabled: enabled,
        ...nextFlags,
      }
    })
  }

  function validateFields(requireConfiguredEmails: boolean): FieldErrors {
    const next: FieldErrors = {}
    const recipient = settings.adminRecipientEmail.trim()
    const replyTo = settings.replyToEmail.trim()
    const sender = settings.senderName.trim()

    if (requireConfiguredEmails || recipient) {
      if (!recipient) {
        next.adminRecipientEmail = t('admin.settings.email.errors.recipientRequired')
      } else if (!isValidEmail(recipient)) {
        next.adminRecipientEmail = t('admin.settings.email.errors.invalidEmail')
      }
    }

    if (requireConfiguredEmails || sender) {
      if (!sender) {
        next.senderName = t('admin.settings.email.errors.senderRequired')
      }
    }

    if (replyTo && !isValidEmail(replyTo)) {
      next.replyToEmail = t('admin.settings.email.errors.invalidEmail')
    }

    return next
  }

  async function handleSave() {
    if (!token || busy) {
      return
    }

    const errors = validateFields(settings.emailNotificationsEnabled)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      showError(t('admin.settings.email.errors.fixInvalid'))
      return
    }

    setIsSaving(true)
    try {
      const result = await updateAdminEmailSettings(token, {
        emailNotificationsEnabled: settings.emailNotificationsEnabled,
        notifyAdminNewSubmission: settings.notifyAdminNewSubmission,
        notifyAdminResubmission: settings.notifyAdminResubmission,
        notifyContributorReceived: settings.notifyContributorReceived,
        notifyContributorApproved: settings.notifyContributorApproved,
        notifyContributorRejected: settings.notifyContributorRejected,
        notifyContributorChangesRequested: settings.notifyContributorChangesRequested,
        adminRecipientEmail: settings.adminRecipientEmail,
        senderName: settings.senderName,
        replyToEmail: settings.replyToEmail,
      })
      setSettings(result.settings)
      setUsedMock(result.usedMock)
      setFieldErrors({})
      showSuccess(
        result.usedMock
          ? t('admin.settings.email.saveSuccessMock')
          : t('admin.settings.email.saveSuccess'),
      )
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('admin.settings.email.saveError')
      showError(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTestEmail() {
    if (!token || busy) {
      return
    }

    const errors = validateFields(true)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      showError(t('admin.settings.email.errors.formInvalid'))
      return
    }

    setIsTesting(true)
    try {
      const result = await sendAdminEmailTest(token, {
        adminRecipientEmail: settings.adminRecipientEmail,
        senderName: settings.senderName,
        replyToEmail: settings.replyToEmail,
      })
      setSettings((previous) => ({
        ...previous,
        deliveryStatus: result.deliveryStatus,
      }))
      setUsedMock(result.usedMock)

      if (result.success) {
        showSuccess(
          result.message ??
            (result.usedMock
              ? t('admin.settings.email.testSuccessMock')
              : t('admin.settings.email.testSuccess')),
        )
      } else {
        showError(result.message ?? t('admin.settings.email.testError'))
      }
    } catch (error) {
      setSettings((previous) => ({
        ...previous,
        deliveryStatus: 'test_failed',
      }))
      const message =
        error instanceof ApiError ? error.message : t('admin.settings.email.testError')
      showError(message)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 pb-12">
      <SaveFeedbackToast toast={toast} onDismiss={dismissToast} />

      <div className="rounded-2xl border border-border/70 bg-white px-5 py-4 shadow-[var(--shadow-card)] sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {t('nav.administration')}
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-navy">
              {t('admin.settings.title')}
            </h1>
            <p className="mt-1.5 text-sm text-navy-muted">{t('admin.settings.subtitle')}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            disabled={busy}
            onClick={() => void loadSettings()}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            {t('admin.settings.refresh')}
          </Button>
        </div>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p>{loadError}</p>
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-red-900 underline"
            onClick={() => void loadSettings()}
          >
            {t('common.tryAgain')}
          </button>
        </div>
      ) : null}

      {usedMock && !loadError ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {t('admin.settings.mockNotice')}
        </p>
      ) : null}

      {inlineFeedback ? (
        <SaveFeedbackBanner
          ref={inlineRef}
          variant={inlineFeedback.variant}
          message={inlineFeedback.message}
          exiting={inlineExiting}
        />
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border/70 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-semibold text-navy">
                {t('admin.settings.email.title')}
              </h2>
              <p className="mt-1 text-sm text-navy-muted">{t('admin.settings.email.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          {isLoading ? (
            <p className="text-sm text-navy-muted" role="status">
              {t('admin.settings.loading')}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">
                    {t('admin.settings.email.masterLabel')}
                  </p>
                  <p className="mt-0.5 text-xs text-navy-muted">
                    {t('admin.settings.email.masterHint')}
                  </p>
                </div>
                <div className="shrink-0 sm:min-w-[14rem]">
                  <SettingsSwitch
                    id="email-notifications-master"
                    label={t('admin.settings.email.masterLabel')}
                    checked={notificationsActive}
                    disabled={busy}
                    activeLabel={t('admin.settings.email.active')}
                    inactiveLabel={t('admin.settings.email.inactive')}
                    onChange={handleMasterNotificationsChange}
                    showLabel={false}
                  />
                </div>
              </div>

              <fieldset
                disabled={!notificationsActive || busy}
                className={[
                  'space-y-3 rounded-xl border border-border p-4',
                  !notificationsActive ? 'bg-muted/10' : 'bg-white',
                ].join(' ')}
              >
                <legend className="px-1 text-sm font-semibold text-navy">
                  {t('admin.settings.email.eventsTitle')}
                </legend>
                <p className="text-xs text-navy-muted">
                  {notificationsActive
                    ? t('admin.settings.email.eventsHint')
                    : t('admin.settings.email.eventsDisabledHint')}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {notificationFlags.map(({ key, label }) => (
                    <div
                      key={key}
                      className={[
                        'rounded-xl border border-border px-3.5 py-3',
                        !notificationsActive ? 'bg-muted/20' : 'bg-white',
                      ].join(' ')}
                    >
                      <SettingsSwitch
                        id={`email-event-${key}`}
                        label={label}
                        checked={settings[key]}
                        disabled={!notificationsActive || busy}
                        activeLabel={t('admin.settings.email.active')}
                        inactiveLabel={t('admin.settings.email.inactive')}
                        onChange={(checked) => updateSetting(key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="admin-email-recipient"
                  label={t('admin.settings.email.adminRecipient')}
                  type="email"
                  autoComplete="email"
                  value={settings.adminRecipientEmail}
                  disabled={busy}
                  error={fieldErrors.adminRecipientEmail}
                  onChange={(event) => updateSetting('adminRecipientEmail', event.target.value)}
                  hint={t('admin.settings.email.adminRecipientHint')}
                />
                <TextField
                  id="admin-email-sender"
                  label={t('admin.settings.email.senderName')}
                  type="text"
                  autoComplete="organization"
                  value={settings.senderName}
                  disabled={busy}
                  error={fieldErrors.senderName}
                  onChange={(event) => updateSetting('senderName', event.target.value)}
                />
                <div className="sm:col-span-2">
                  <TextField
                    id="admin-email-reply-to"
                    label={t('admin.settings.email.replyTo')}
                    type="email"
                    autoComplete="email"
                    value={settings.replyToEmail}
                    disabled={busy}
                    error={fieldErrors.replyToEmail}
                    onChange={(event) => updateSetting('replyToEmail', event.target.value)}
                    hint={t('admin.settings.email.replyToHint')}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-muted">
                    {t('admin.settings.email.deliveryStatus')}
                  </p>
                  <span
                    className={[
                      'mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                      deliveryStatusClass(settings.deliveryStatus),
                    ].join(' ')}
                  >
                    {t(`admin.settings.email.delivery.${settings.deliveryStatus}`)}
                  </span>
                </div>
                <p className="max-w-md text-xs text-navy-muted">
                  {t('admin.settings.email.noSmtpNotice')}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2.5 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void handleTestEmail()}
                >
                  <Send className="mr-2 h-4 w-4" aria-hidden />
                  {isTesting
                    ? t('admin.settings.email.testing')
                    : t('admin.settings.email.sendTest')}
                </Button>
                <Button type="button" disabled={busy} onClick={() => void handleSave()}>
                  {isSaving ? t('admin.settings.email.saving') : t('admin.settings.email.save')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
