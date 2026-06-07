import { Card } from '../ui/Card'
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-navy">{value}</p>
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
    <Card>
      <h2 className="font-serif text-lg font-semibold text-navy">Admin info</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <DetailItem key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </Card>
  )
}
