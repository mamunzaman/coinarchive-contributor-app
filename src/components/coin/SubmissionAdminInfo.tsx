import type { CoinAcfDetail } from '../../types/coinForm'
import { COIN_RECORD_STATUS_OPTIONS } from '../../types/coinForm'

function formatBoolean(value: number | boolean | undefined): string {
  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return Number(value) === 1 ? 'Yes' : 'No'
}

function formatRecordStatus(value: string | undefined): string {
  if (!value) {
    return ''
  }

  if (COIN_RECORD_STATUS_OPTIONS.includes(value as (typeof COIN_RECORD_STATUS_OPTIONS)[number])) {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  return value
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4 sm:py-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-muted">{label}</dt>
      <dd className="text-sm leading-relaxed text-navy">{value}</dd>
    </div>
  )
}

type SubmissionAdminInfoProps = {
  acf?: CoinAcfDetail
}

export function SubmissionAdminInfo({ acf }: SubmissionAdminInfoProps) {
  if (!acf) {
    return null
  }

  const items = [
    {
      label: 'Published catalogue',
      value: formatBoolean(acf.coin_is_published_catalogue),
    },
    { label: 'Featured', value: formatBoolean(acf.coin_is_featured) },
    { label: 'App enabled', value: formatBoolean(acf.coin_is_app_enabled) },
    { label: 'Record status', value: formatRecordStatus(acf.coin_record_status) },
  ].filter((item) => item.value !== '')

  if (items.length === 0) {
    return null
  }

  return (
    <section className="border-t border-border/50 pt-8">
      <h2 className="font-serif text-xl font-semibold text-navy">Admin info</h2>
      <dl className="mt-4 divide-y divide-border/60 border-y border-border/60">
        {items.map((item) => (
          <DetailRow key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
    </section>
  )
}
