import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export const ICON_INLINE = 'h-4 w-4 shrink-0'
export const ICON_ACTION = 'h-[18px] w-[18px] shrink-0'
export const ICON_NAV = 'h-5 w-5 shrink-0'

const compactPrimary =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover'
const compactNeutral =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-white text-navy transition-colors hover:border-navy/15 hover:bg-muted'
const compactDanger =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50/80 text-red-700 transition-colors hover:bg-red-100'

type CompactActionLinkProps = {
  to: string
  label: string
  icon: LucideIcon
  variant?: 'primary' | 'neutral'
}

export function CompactActionLink({
  to,
  label,
  icon: Icon,
  variant = 'primary',
}: CompactActionLinkProps) {
  return (
    <Link
      to={to}
      title={label}
      aria-label={label}
      className={variant === 'primary' ? compactPrimary : compactNeutral}
    >
      <Icon className={ICON_ACTION} aria-hidden />
    </Link>
  )
}

type CompactActionButtonProps = {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
}

export function CompactActionButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: CompactActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[compactDanger, 'disabled:opacity-50'].join(' ')}
    >
      <Icon className={ICON_ACTION} aria-hidden />
    </button>
  )
}

type LabeledActionLinkProps = {
  to: string
  label: string
  icon: LucideIcon
  className?: string
}

export function LabeledActionLink({
  to,
  label,
  icon: Icon,
  className = 'action-btn-primary min-h-11 flex-1',
}: LabeledActionLinkProps) {
  return (
    <Link to={to} className={[className, 'inline-flex items-center justify-center gap-2'].join(' ')}>
      <Icon className={ICON_ACTION} aria-hidden />
      <span>{label}</span>
    </Link>
  )
}

type LabeledActionButtonProps = {
  label: string
  icon: LucideIcon
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'neutral' | 'danger' | 'ghost'
  className?: string
  type?: 'button' | 'submit'
}

export function LabeledActionButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  variant = 'neutral',
  className,
  type = 'button',
}: LabeledActionButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'action-btn-primary'
      : variant === 'danger'
        ? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50'
        : variant === 'ghost'
          ? 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border/70 bg-white px-3 text-sm font-semibold text-navy transition-colors hover:border-primary/30 hover:bg-white disabled:opacity-50'
          : 'action-btn-neutral'

  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[variantClass, className, 'gap-2'].filter(Boolean).join(' ')}
    >
      <Icon className={ICON_ACTION} aria-hidden />
      <span>{label}</span>
    </button>
  )
}

type IconLabelProps = {
  icon: LucideIcon
  children: ReactNode
  className?: string
  iconClassName?: string
}

export function IconLabel({
  icon: Icon,
  children,
  className = '',
  iconClassName = ICON_ACTION,
}: IconLabelProps) {
  return (
    <span className={['inline-flex items-center gap-2', className].join(' ')}>
      <Icon className={iconClassName} aria-hidden />
      <span>{children}</span>
    </span>
  )
}

type IconFileLabelProps = ComponentPropsWithoutRef<'label'> & {
  icon: LucideIcon
  label: string
  disabled?: boolean
}

export function IconFileLabel({
  icon: Icon,
  label,
  disabled = false,
  className = '',
  children,
  ...props
}: IconFileLabelProps) {
  return (
    <label
      {...props}
      title={label}
      aria-label={label}
      className={[
        'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border/70 bg-white px-3 text-sm font-semibold text-navy transition-colors',
        disabled ? 'pointer-events-none opacity-50' : 'hover:border-primary/30 hover:bg-white',
        className,
      ].join(' ')}
    >
      {children}
      <Icon className={ICON_ACTION} aria-hidden />
      <span>{label}</span>
    </label>
  )
}
