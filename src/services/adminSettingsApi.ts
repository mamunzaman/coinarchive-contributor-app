import { ApiError, coinArchiveFetch, getApiBaseUrl } from '../lib/api'
import { parseApiError, readJsonResponse, resolveHttpStatus } from '../lib/apiErrors'
import {
  DEFAULT_ADMIN_EMAIL_SETTINGS,
  type AdminEmailSettings,
  type AdminEmailSettingsResponse,
  type AdminEmailSettingsUpdatePayload,
  type AdminEmailTestResponse,
  type EmailDeliveryStatus,
} from '../types/adminEmailSettings'

const EMAIL_SETTINGS_PATH = '/admin/settings/email'
const EMAIL_TEST_PATH = '/admin/settings/email/test'

let mockStore: AdminEmailSettings = { ...DEFAULT_ADMIN_EMAIL_SETTINGS }

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

function shouldUseMockFallback(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false
  }

  return (
    import.meta.env.DEV &&
    (error.status === 404 || error.status === 501 || error.status === 0)
  )
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (value === 1 || value === '1' || value === 'true') {
    return true
  }
  if (value === 0 || value === '0' || value === 'false') {
    return false
  }
  return fallback
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function readDeliveryStatus(value: unknown): EmailDeliveryStatus {
  if (
    value === 'configured' ||
    value === 'not_configured' ||
    value === 'test_successful' ||
    value === 'test_failed'
  ) {
    return value
  }
  return 'not_configured'
}

function deriveDeliveryStatus(settings: Omit<AdminEmailSettings, 'deliveryStatus'>): EmailDeliveryStatus {
  const hasRecipient = settings.adminRecipientEmail.trim().length > 0
  const hasSender = settings.senderName.trim().length > 0
  return hasRecipient && hasSender ? 'configured' : 'not_configured'
}

export function parseAdminEmailSettings(raw: unknown): AdminEmailSettings {
  const record =
    typeof raw === 'object' && raw !== null
      ? ((raw as { settings?: unknown }).settings ?? raw)
      : null

  if (typeof record !== 'object' || record === null) {
    return { ...DEFAULT_ADMIN_EMAIL_SETTINGS }
  }

  const data = record as Record<string, unknown>
  const base: Omit<AdminEmailSettings, 'deliveryStatus'> = {
    emailNotificationsEnabled: readBoolean(
      data.emailNotificationsEnabled ?? data.email_notifications_enabled,
      DEFAULT_ADMIN_EMAIL_SETTINGS.emailNotificationsEnabled,
    ),
    notifyAdminNewSubmission: readBoolean(
      data.notifyAdminNewSubmission ?? data.notify_admin_new_submission,
      DEFAULT_ADMIN_EMAIL_SETTINGS.notifyAdminNewSubmission,
    ),
    notifyAdminResubmission: readBoolean(
      data.notifyAdminResubmission ?? data.notify_admin_resubmission,
      DEFAULT_ADMIN_EMAIL_SETTINGS.notifyAdminResubmission,
    ),
    notifyContributorReceived: readBoolean(
      data.notifyContributorReceived ?? data.notify_contributor_received,
      DEFAULT_ADMIN_EMAIL_SETTINGS.notifyContributorReceived,
    ),
    notifyContributorApproved: readBoolean(
      data.notifyContributorApproved ?? data.notify_contributor_approved,
      DEFAULT_ADMIN_EMAIL_SETTINGS.notifyContributorApproved,
    ),
    notifyContributorRejected: readBoolean(
      data.notifyContributorRejected ?? data.notify_contributor_rejected,
      DEFAULT_ADMIN_EMAIL_SETTINGS.notifyContributorRejected,
    ),
    notifyContributorChangesRequested: readBoolean(
      data.notifyContributorChangesRequested ?? data.notify_contributor_changes_requested,
      DEFAULT_ADMIN_EMAIL_SETTINGS.notifyContributorChangesRequested,
    ),
    adminRecipientEmail: readString(
      data.adminRecipientEmail ?? data.admin_recipient_email,
      DEFAULT_ADMIN_EMAIL_SETTINGS.adminRecipientEmail,
    ),
    senderName: readString(
      data.senderName ?? data.sender_name,
      DEFAULT_ADMIN_EMAIL_SETTINGS.senderName,
    ),
    replyToEmail: readString(
      data.replyToEmail ?? data.reply_to_email,
      DEFAULT_ADMIN_EMAIL_SETTINGS.replyToEmail,
    ),
  }

  const explicitStatus = data.deliveryStatus ?? data.delivery_status
  return {
    ...base,
    deliveryStatus:
      explicitStatus !== undefined
        ? readDeliveryStatus(explicitStatus)
        : deriveDeliveryStatus(base),
  }
}

function toApiPayload(settings: AdminEmailSettingsUpdatePayload): Record<string, unknown> {
  return {
    email_notifications_enabled: settings.emailNotificationsEnabled,
    notify_admin_new_submission: settings.notifyAdminNewSubmission,
    notify_admin_resubmission: settings.notifyAdminResubmission,
    notify_contributor_received: settings.notifyContributorReceived,
    notify_contributor_approved: settings.notifyContributorApproved,
    notify_contributor_rejected: settings.notifyContributorRejected,
    notify_contributor_changes_requested: settings.notifyContributorChangesRequested,
    admin_recipient_email: settings.adminRecipientEmail.trim(),
    sender_name: settings.senderName.trim(),
    reply_to_email: settings.replyToEmail.trim(),
  }
}

async function throwOnFailure(response: Response): Promise<never> {
  const data = await readJsonResponse(response)
  const parsed = parseApiError(data, `Request failed (${response.status}).`)
  throw new ApiError(
    parsed.message,
    resolveHttpStatus(response.status, data),
    parsed.code,
  )
}

/**
 * Loads admin email notification settings.
 * Ready for GET /admin/settings/email — uses isolated mock when endpoint is unavailable in DEV.
 * Never returns or requests SMTP credentials.
 */
export async function getAdminEmailSettings(token: string): Promise<AdminEmailSettingsResponse> {
  try {
    const response = await coinArchiveFetch(`${getApiBaseUrl()}${EMAIL_SETTINGS_PATH}`, {
      method: 'GET',
      headers: authHeaders(token),
    })

    if (!response.ok) {
      await throwOnFailure(response)
    }

    const data = await readJsonResponse(response)
    return {
      settings: parseAdminEmailSettings(data),
      usedMock: false,
    }
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return {
        settings: { ...mockStore },
        usedMock: true,
      }
    }
    throw error
  }
}

/**
 * Saves admin email notification settings.
 * Ready for PUT /admin/settings/email — uses isolated mock when endpoint is unavailable in DEV.
 */
export async function updateAdminEmailSettings(
  token: string,
  payload: AdminEmailSettingsUpdatePayload,
): Promise<AdminEmailSettingsResponse> {
  try {
    const response = await coinArchiveFetch(`${getApiBaseUrl()}${EMAIL_SETTINGS_PATH}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(toApiPayload(payload)),
    })

    if (!response.ok) {
      await throwOnFailure(response)
    }

    const data = await readJsonResponse(response)
    return {
      settings: parseAdminEmailSettings(data),
      usedMock: false,
    }
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const next: AdminEmailSettings = {
        ...payload,
        adminRecipientEmail: payload.adminRecipientEmail.trim(),
        senderName: payload.senderName.trim(),
        replyToEmail: payload.replyToEmail.trim(),
        deliveryStatus: deriveDeliveryStatus(payload),
      }
      mockStore = next
      return { settings: { ...mockStore }, usedMock: true }
    }
    throw error
  }
}

/**
 * Sends a test email using current saved/draft recipient settings.
 * Ready for POST /admin/settings/email/test — uses isolated mock when endpoint is unavailable in DEV.
 */
export async function sendAdminEmailTest(
  token: string,
  payload: Pick<AdminEmailSettingsUpdatePayload, 'adminRecipientEmail' | 'senderName' | 'replyToEmail'>,
): Promise<AdminEmailTestResponse> {
  try {
    const response = await coinArchiveFetch(`${getApiBaseUrl()}${EMAIL_TEST_PATH}`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        admin_recipient_email: payload.adminRecipientEmail.trim(),
        sender_name: payload.senderName.trim(),
        reply_to_email: payload.replyToEmail.trim(),
      }),
    })

    if (!response.ok) {
      await throwOnFailure(response)
    }

    const data = await readJsonResponse(response)
    const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
    const deliveryStatus = readDeliveryStatus(record.deliveryStatus ?? record.delivery_status ?? 'test_successful')

    return {
      success: record.success !== false,
      message: typeof record.message === 'string' ? record.message : undefined,
      deliveryStatus,
      usedMock: false,
    }
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const configured =
        payload.adminRecipientEmail.trim().length > 0 && payload.senderName.trim().length > 0
      const deliveryStatus: EmailDeliveryStatus = configured ? 'test_successful' : 'test_failed'
      mockStore = {
        ...mockStore,
        adminRecipientEmail: payload.adminRecipientEmail.trim() || mockStore.adminRecipientEmail,
        senderName: payload.senderName.trim() || mockStore.senderName,
        replyToEmail: payload.replyToEmail.trim() || mockStore.replyToEmail,
        deliveryStatus,
      }
      return {
        success: deliveryStatus === 'test_successful',
        message:
          deliveryStatus === 'test_successful'
            ? 'Mock test email recorded successfully.'
            : 'Mock test email failed: recipient or sender is missing.',
        deliveryStatus,
        usedMock: true,
      }
    }
    throw error
  }
}
