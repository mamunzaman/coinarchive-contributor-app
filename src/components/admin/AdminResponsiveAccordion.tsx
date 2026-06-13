import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export type AdminAccordionHeaderProps = {
  eyebrow?: string
  icon?: ReactNode
  heading: ReactNode
  trailing?: ReactNode
}

type AdminResponsiveAccordionProps = {
  id?: string
  compact: boolean
  children: ReactNode
  className?: string
  panelClassName?: string
  header: AdminAccordionHeaderProps
}

export function AdminCompactSectionHeader({
  eyebrow,
  icon,
  heading,
  trailing,
  chevron,
}: AdminAccordionHeaderProps & { chevron?: ReactNode }) {
  return (
    <>
      <span className="admin-compact-header__leading">
        {eyebrow ? <span className="admin-compact-header__eyebrow">{eyebrow}</span> : null}
        <span className="admin-compact-header__title-row">
          {icon ? <span className="admin-compact-header__icon" aria-hidden>{icon}</span> : null}
          <span className="admin-compact-header__heading">{heading}</span>
        </span>
      </span>
      <span className="admin-compact-header__trailing">
        {trailing ? <span className="admin-compact-header__meta">{trailing}</span> : null}
        {chevron}
      </span>
    </>
  )
}

export function AdminResponsiveAccordion({
  id,
  compact,
  children,
  className = '',
  panelClassName = '',
  header,
}: AdminResponsiveAccordionProps) {
  const generatedId = useId()
  const sectionId = id ?? generatedId.replace(/:/g, '')
  const headingId = `${sectionId}-heading`
  const panelId = `${sectionId}-panel`
  const [open, setOpen] = useState(!compact)
  const prevCompactRef = useRef(compact)

  useEffect(() => {
    if (compact && !prevCompactRef.current) {
      setOpen(false)
    } else if (!compact && prevCompactRef.current) {
      setOpen(true)
    }
    prevCompactRef.current = compact
  }, [compact])

  if (!compact) {
    return (
      <section id={sectionId} className={className}>
        {children}
      </section>
    )
  }

  const chevron = (
    <ChevronDown
      className={[
        'admin-responsive-accordion__chevron',
        open ? 'admin-responsive-accordion__chevron--open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    />
  )

  return (
    <section
      id={sectionId}
      className={['admin-responsive-accordion', className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        id={headingId}
        className="admin-responsive-accordion__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <AdminCompactSectionHeader {...header} chevron={chevron} />
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headingId}
          className={['admin-responsive-accordion__panel', panelClassName].filter(Boolean).join(' ')}
        >
          {children}
        </div>
      ) : null}
    </section>
  )
}
