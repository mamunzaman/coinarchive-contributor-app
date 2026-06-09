import type { ReactNode } from 'react'
import type { CoinSubmissionDetail, SubmissionActivityLogsPayload } from '../../lib/api'
import type { TimelineEvent } from '../../lib/submissionTimeline'
import { SubmissionActivityTimeline } from './SubmissionActivityTimeline'
import { SubmissionAdminInfo } from './SubmissionAdminInfo'
import { SubmissionDetailImages } from './SubmissionDetailImages'
import { SubmissionDetailKeyFacts } from './SubmissionDetailKeyFacts'
import { SubmissionDetailsTable } from './SubmissionDetailsTable'
import { SubmissionMintInfo } from './SubmissionMintInfo'
import { SubmissionTimeline } from './SubmissionTimeline'
import type { SubmissionDetailImageEditHandlers } from './SubmissionDetailSections'

export type { SubmissionDetailImageEditHandlers }

export type SubmissionDetailLayoutVariant = 'contributor' | 'admin'

type SubmissionDetailLayoutProps = {
  submission: CoinSubmissionDetail
  imageEdit: SubmissionDetailImageEditHandlers
  hasActivityLogsField: boolean
  activityLogs?: SubmissionActivityLogsPayload
  timelineEvents: TimelineEvent[]
  showAdminInfo?: boolean
  header: ReactNode
  beforeMain?: ReactNode
  sidebar?: ReactNode
  layoutVariant?: SubmissionDetailLayoutVariant
}

export function SubmissionDetailLayout({
  submission,
  imageEdit,
  hasActivityLogsField,
  activityLogs,
  timelineEvents,
  showAdminInfo = false,
  header,
  beforeMain,
  sidebar,
  layoutVariant = 'contributor',
}: SubmissionDetailLayoutProps) {
  const hasSidebar = Boolean(sidebar)
  const isAdminReview = layoutVariant === 'admin' && hasSidebar

  const shellClass = isAdminReview
    ? 'submission-detail-admin-shell'
    : hasSidebar
      ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_320px]'
      : ''

  const mainClass = isAdminReview
    ? 'submission-detail-admin-main flex flex-col gap-6'
    : 'flex min-w-0 flex-col gap-6'

  const sidebarClass = isAdminReview
    ? 'submission-detail-admin-sidebar order-first space-y-4 xl:order-none'
    : 'order-first min-w-0 space-y-4 lg:order-none lg:sticky lg:top-5 lg:self-start'

  const summaryClass = isAdminReview
    ? 'scroll-mt-24 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,280px)]'
    : 'scroll-mt-24 grid items-start gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,300px)]'

  const dataClass = isAdminReview
    ? 'scroll-mt-24 grid grid-cols-1 items-start gap-4 2xl:grid-cols-2'
    : 'scroll-mt-24 grid items-start gap-4 md:grid-cols-2'

  const mintSpanClass = isAdminReview ? '2xl:col-span-2' : 'md:col-span-2'

  return (
    <article className="pb-24 pt-2">
      {header}

      {beforeMain ? <div className="mt-4">{beforeMain}</div> : null}

      <div className={[beforeMain ? 'mt-4' : 'mt-6', shellClass].filter(Boolean).join(' ')}>
        <div className={mainClass}>
          <section id="review-summary" className={summaryClass}>
            <div className="min-w-0">
              <SubmissionDetailImages
                submission={submission}
                layout="faces"
                compactHero
                {...imageEdit}
              />
            </div>
            <SubmissionDetailKeyFacts submission={submission} />
          </section>

          <section id="review-data" className={dataClass}>
            <SubmissionDetailsTable submission={submission} />
            <div id="review-mint" className={['h-fit self-start scroll-mt-24', mintSpanClass].join(' ')}>
              <SubmissionMintInfo acf={submission.acf} />
            </div>
          </section>

          {showAdminInfo ? (
            <section id="review-admin" className="scroll-mt-24">
              <SubmissionAdminInfo acf={submission.acf} />
            </section>
          ) : null}

          <section id="review-images" className="scroll-mt-24">
            <SubmissionDetailImages submission={submission} layout="gallery" {...imageEdit} />
          </section>

          <section id="review-activity" className="scroll-mt-24">
            {hasActivityLogsField && activityLogs ? (
              <SubmissionActivityTimeline
                activityLogs={activityLogs}
                submissionId={submission.id}
                compact
              />
            ) : (
              <SubmissionTimeline events={timelineEvents} compact />
            )}
          </section>

          <SubmissionDetailImages submission={submission} layout="actions" {...imageEdit} />
        </div>

        {sidebar ? <div className={sidebarClass}>{sidebar}</div> : null}
      </div>
    </article>
  )
}
