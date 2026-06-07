const tips = [
  {
    title: 'Complete core identity first',
    body: 'Accurate title, country, year, denomination, and coin type help reviewers approve entries faster.',
  },
  {
    title: 'Add clear obverse and reverse photos',
    body: 'Well-lit images with neutral backgrounds improve catalogue quality and search visibility.',
  },
  {
    title: 'Edit while pending',
    body: 'You can update a submission until it is published. Use Edit on any pending entry to refine details.',
  },
]

export function DashboardContributorTips() {
  return (
    <aside className="rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-24">
      <p className="section-label">Contributor guide</p>
      <h2 className="mt-3 font-serif text-lg font-semibold text-navy">Submission tips</h2>
      <p className="mt-2 text-sm leading-relaxed text-navy-muted">
        Practical guidance for building catalogue-ready coin entries on CoinEuropa Archive.
      </p>
      <ul className="mt-5 space-y-4">
        {tips.map((tip) => (
          <li key={tip.title} className="rounded-xl border border-border/60 bg-page px-4 py-3">
            <p className="text-sm font-semibold text-navy">{tip.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-navy-muted">{tip.body}</p>
          </li>
        ))}
      </ul>
    </aside>
  )
}
