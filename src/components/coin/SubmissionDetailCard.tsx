import type { ReactNode } from 'react'
import { REVIEW_EMPTY_VALUE } from '../../types/coinForm'

export function DetailSectionCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={[
        'detail-section-card h-fit w-full self-start overflow-hidden rounded-xl border border-border/60 bg-white shadow-[var(--shadow-card)]',
        className,
      ].join(' ')}
    >
      <header className="border-b border-border/50 bg-[#faf9f7]/80 px-4 py-3 sm:px-5">
        <h2 className="font-serif text-base font-semibold text-navy sm:text-lg">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-navy-muted">{subtitle}</p> : null}
      </header>
      <div className="min-w-0 px-4 py-4 sm:px-5">{children}</div>
    </section>
  )
}

export function DetailFieldRow({
  label,
  value,
  emptyLabel = REVIEW_EMPTY_VALUE,
  className = '',
  valueVariant = 'default',
}: {
  label: string
  value: string
  emptyLabel?: string
  className?: string
  valueVariant?: 'default' | 'code'
}) {
  const trimmed = value.trim()
  const isEmpty = !trimmed

  return (
    <div
      className={[
        'detail-field-row border-b border-border/40 py-2.5 first:pt-0 last:border-b-0 last:pb-0',
        className,
      ].join(' ')}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        {label}
      </dt>
      <dd
        className={[
          'detail-field-row__value mt-0.5 min-w-0 text-sm leading-relaxed',
          valueVariant === 'code' ? 'detail-field-row__value--code' : '',
          isEmpty ? 'italic text-navy-muted' : 'text-navy',
        ].join(' ')}
      >
        {trimmed || emptyLabel}
      </dd>
    </div>
  )
}

export function DetailFieldGrid({ children }: { children: ReactNode }) {
  return <dl className="detail-field-grid">{children}</dl>
}

export function DetailTextBlock({
  label,
  value,
  emptyLabel = REVIEW_EMPTY_VALUE,
}: {
  label: string
  value: string
  emptyLabel?: string
}) {
  const trimmed = value.trim()

  return (
    <div className="detail-field-row detail-field-span-full border-b border-border/40 py-2.5 first:pt-0 last:border-b-0 last:pb-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        {label}
      </dt>
      <dd className="mt-1.5 min-w-0">
        {trimmed ? (
          <div className="detail-field-row__value max-h-36 overflow-y-auto rounded-lg bg-muted/20 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-navy">
            {trimmed}
          </div>
        ) : (
          <span className="text-sm italic text-navy-muted">{emptyLabel}</span>
        )}
      </dd>
    </div>
  )
}
