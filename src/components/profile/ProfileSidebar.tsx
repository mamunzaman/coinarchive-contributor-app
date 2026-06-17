import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuthContributor } from '../../types/auth'
import { Card } from '../ui/Card'
import { RoleBadge } from '../ui/RoleBadge'
import { StatusBadge } from '../ui/StatusBadge'

type ProfileSidebarProps = {
  user: AuthContributor
  role: 'admin' | 'contributor'
  hasSession: boolean
}

function SidebarRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-navy-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-navy">{children}</dd>
    </div>
  )
}

export function ProfileAccountStatusCard({ user, role, hasSession }: ProfileSidebarProps) {
  const { t } = useTranslation()

  return (
    <Card className="profile-page__sidebar-card">
      <h2 className="font-serif text-base font-semibold text-navy">{t('profile.sidebar.accountStatus')}</h2>
      <dl className="mt-3">
        <SidebarRow label={t('profile.status')}>
          <StatusBadge status={user.status} />
        </SidebarRow>
        <SidebarRow label={t('profile.role')}>
          <RoleBadge role={role} />
        </SidebarRow>
        {user.email_verified !== undefined ? (
          <SidebarRow label={t('profile.sidebar.emailVerified')}>
            <span className={user.email_verified ? 'text-teal-700' : 'text-amber-700'}>
              {user.email_verified
                ? t('profile.sidebar.emailVerifiedYes')
                : t('profile.sidebar.emailVerifiedNo')}
            </span>
          </SidebarRow>
        ) : null}
        <SidebarRow label={t('profile.session')}>
          {hasSession ? t('profile.sessionActive') : t('profile.sessionInactive')}
        </SidebarRow>
        <SidebarRow label={t('profile.contributorId')}>
          <span className="tabular-nums">{user.id}</span>
        </SidebarRow>
      </dl>
    </Card>
  )
}

export function ProfileSecurityCard() {
  const { t } = useTranslation()

  return (
    <Card className="profile-page__sidebar-card">
      <h2 className="font-serif text-base font-semibold text-navy">{t('profile.sidebar.security')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-navy-muted">
        {t('profile.sidebar.passwordLastChangedUnknown')}
      </p>
    </Card>
  )
}
