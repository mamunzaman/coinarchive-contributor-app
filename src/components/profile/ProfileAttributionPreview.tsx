import { useTranslation } from 'react-i18next'
import { getContributorDisplayName } from '../../lib/submissionContributorAttribution'
import { Card } from '../ui/Card'

type ProfileAttributionPreviewProps = {
  displayName: string
  email: string
}

export function ProfileAttributionPreview({ displayName, email }: ProfileAttributionPreviewProps) {
  const { t } = useTranslation()
  const attribution = getContributorDisplayName({ name: displayName, email })

  return (
    <Card className="profile-page__attribution-card">
      <h2 className="font-serif text-base font-semibold text-navy">
        {t('profile.attribution.title')}
      </h2>
      <p className="mt-1 text-sm text-navy-muted">{t('profile.attribution.subtitle')}</p>
      <div className="mt-4 rounded-xl border border-border/60 bg-panel/50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-muted">
          {t('profile.attribution.publicName')}
        </p>
        <p className="mt-1 font-medium text-navy">{attribution}</p>
        {email.trim() ? (
          <p className="mt-2 text-sm text-navy-muted break-all">{email}</p>
        ) : null}
      </div>
    </Card>
  )
}
