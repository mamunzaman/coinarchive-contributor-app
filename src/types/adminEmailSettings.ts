export type EmailDeliveryStatus =
  | 'configured'
  | 'not_configured'
  | 'test_successful'
  | 'test_failed'

export type AdminEmailNotificationFlags = {
  notifyAdminNewSubmission: boolean
  notifyAdminResubmission: boolean
  notifyContributorReceived: boolean
  notifyContributorApproved: boolean
  notifyContributorRejected: boolean
  notifyContributorChangesRequested: boolean
}

export type AdminEmailSettings = AdminEmailNotificationFlags & {
  emailNotificationsEnabled: boolean
  adminRecipientEmail: string
  senderName: string
  replyToEmail: string
  deliveryStatus: EmailDeliveryStatus
}

export type AdminEmailSettingsUpdatePayload = Omit<AdminEmailSettings, 'deliveryStatus'>

export type AdminEmailSettingsResponse = {
  settings: AdminEmailSettings
  usedMock: boolean
}

export type AdminEmailTestResponse = {
  success: boolean
  message?: string
  deliveryStatus: EmailDeliveryStatus
  usedMock: boolean
}

export const DEFAULT_ADMIN_EMAIL_SETTINGS: AdminEmailSettings = {
  emailNotificationsEnabled: false,
  notifyAdminNewSubmission: true,
  notifyAdminResubmission: true,
  notifyContributorReceived: true,
  notifyContributorApproved: true,
  notifyContributorRejected: true,
  notifyContributorChangesRequested: true,
  adminRecipientEmail: '',
  senderName: 'CoinArchive',
  replyToEmail: '',
  deliveryStatus: 'not_configured',
}

export const EMAIL_NOTIFICATION_FLAG_KEYS = [
  'notifyAdminNewSubmission',
  'notifyAdminResubmission',
  'notifyContributorReceived',
  'notifyContributorApproved',
  'notifyContributorRejected',
  'notifyContributorChangesRequested',
] as const satisfies ReadonlyArray<keyof AdminEmailNotificationFlags>
