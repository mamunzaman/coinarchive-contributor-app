import type { CoinAcfDetail } from '../../types/coinForm'
import { COIN_RECORD_STATUS_OPTIONS } from '../../types/coinForm'
import { DetailFieldGrid, DetailFieldRow, DetailSectionCard } from './SubmissionDetailCard'

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

type SubmissionAdminInfoProps = {
  acf?: CoinAcfDetail
  bare?: boolean
}

function AdminInfoContent({ acf }: { acf?: CoinAcfDetail }) {
  return (
    <DetailFieldGrid>
      <DetailFieldRow
        label="Published in catalogue"
        value={formatBoolean(acf?.coin_is_published_catalogue)}
      />
      <DetailFieldRow label="Featured coin" value={formatBoolean(acf?.coin_is_featured)} />
      <DetailFieldRow label="App enabled" value={formatBoolean(acf?.coin_is_app_enabled)} />
      <DetailFieldRow label="Record status" value={formatRecordStatus(acf?.coin_record_status)} />
    </DetailFieldGrid>
  )
}

export function SubmissionAdminInfo({ acf, bare = false }: SubmissionAdminInfoProps) {
  const content = <AdminInfoContent acf={acf} />

  if (bare) {
    return content
  }

  return (
    <DetailSectionCard title="Status & visibility" subtitle="Admin catalogue and record settings">
      {content}
    </DetailSectionCard>
  )
}
