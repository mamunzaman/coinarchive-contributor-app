import { lazy, Suspense, type ReactNode } from 'react'

function AdminDetailSectionSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-border/60 bg-surface px-4 py-5"
      aria-hidden
    >
      <div className="h-3 w-32 rounded-full bg-muted" />
      <div className="mt-4 h-5 w-2/3 rounded-full bg-muted" />
      <div className="mt-3 h-3 w-full rounded-full bg-muted/80" />
    </div>
  )
}

export const LazyAdminDataQualityAudit = lazy(() =>
  import('./AdminDataQualityAudit').then((module) => ({
    default: module.AdminDataQualityAudit,
  })),
)

export const LazyAdminSeoYoastPreview = lazy(() =>
  import('./AdminSeoYoastPreview').then((module) => ({
    default: module.AdminSeoYoastPreview,
  })),
)

export function AdminDetailLazySection({ children }: { children: ReactNode }) {
  return <Suspense fallback={<AdminDetailSectionSkeleton />}>{children}</Suspense>
}
