import { useTranslation } from 'react-i18next'
import {
  getContributorDisplayName,
  resolveSubmissionContributor,
  type ContributorAttributionSource,
} from '../../lib/submissionContributorAttribution'

type AdminContributorAttributionProps = {
  source: ContributorAttributionSource
  variant?: 'cell' | 'card' | 'review'
}

function ContributorEmailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="break-all text-inherit hover:text-teal-600 hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {email}
    </a>
  )
}

export function AdminContributorAttribution({
  source,
  variant = 'cell',
}: AdminContributorAttributionProps) {
  const { t } = useTranslation()
  const attribution = resolveSubmissionContributor(source)
  const displayName = getContributorDisplayName(attribution)
  const email = attribution.email?.trim()

  if (variant === 'cell') {
    return (
      <div className="admin-contributor-attribution min-w-0">
        <p className="truncate text-[12px] font-medium leading-snug text-slate-700">{displayName}</p>
        {email ? (
          <p className="mt-0.5 min-w-0 truncate text-[11px] leading-snug text-slate-400">
            <ContributorEmailLink email={email} />
          </p>
        ) : null}
      </div>
    )
  }

  if (variant === 'review') {
    return (
      <div className="admin-contributor-attribution min-w-0 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {t('admin.contributor.sectionTitle')}
        </p>
        <p className="truncate text-sm font-semibold text-slate-700" title={displayName}>
          {displayName}
        </p>
        {email ? (
          <p className="truncate text-[11px] text-slate-500">
            <ContributorEmailLink email={email} />
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <section
      className="admin-contributor-attribution rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-900"
      aria-labelledby="admin-contributor-attribution-title"
    >
      <h2
        id="admin-contributor-attribution-title"
        className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
      >
        {t('admin.contributor.sectionTitle')}
      </h2>
      <dl className="mt-3 space-y-3">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.contributor.nameLabel')}
          </dt>
          <dd className="mt-1 font-semibold text-navy">{displayName}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.contributor.emailLabel')}
          </dt>
          <dd className="mt-1 font-medium text-navy">
            {email ? (
              <ContributorEmailLink email={email} />
            ) : (
              <span className="text-slate-400">{t('admin.contributor.emailUnavailable')}</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}
