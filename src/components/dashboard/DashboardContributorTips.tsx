const tips = [
  {
    title: 'Complete core identity first',
    body: 'Title, country, year, denomination, and coin type help reviewers approve faster.',
  },
  {
    title: 'Add clear photos',
    body: 'Well-lit obverse and reverse images improve catalogue quality.',
  },
]

export function DashboardContributorTips() {
  return (
    <aside className="rounded-xl border border-border/70 bg-surface p-4 shadow-[var(--shadow-card)] xl:sticky xl:top-20">
      <p className="section-label">Contributor guide</p>
      <h2 className="mt-2 font-serif text-base font-semibold text-navy">Quick tips</h2>
      <ul className="mt-3 space-y-2.5">
        {tips.map((tip) => (
          <li key={tip.title} className="rounded-lg border border-border/60 bg-page px-3 py-2.5">
            <p className="text-sm font-semibold text-navy">{tip.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-navy-muted">{tip.body}</p>
          </li>
        ))}
      </ul>
    </aside>
  )
}
