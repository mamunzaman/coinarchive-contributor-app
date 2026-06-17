import {
  Check,
  ChevronDown,
  KeyRound,
  Mail,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdminContributorListItem } from '../../lib/adminApi'

type ConfirmAction =
  | { type: 'approve'; user: AdminContributorListItem }
  | { type: 'reject'; user: AdminContributorListItem }
  | { type: 'promote'; user: AdminContributorListItem }
  | { type: 'demote'; user: AdminContributorListItem }

function isPendingContributorStatus(status: string | undefined): boolean {
  return status === 'pending' || status === 'pending_approval'
}

function isValidContributorUserId(id: unknown): id is number {
  return typeof id === 'number' && Number.isFinite(id) && id > 0
}

type AdminContributorRowActionsProps = {
  user: AdminContributorListItem
  actionUserId: number | null
  currentUserId?: number | null
  onAction: (action: ConfirmAction) => void
  onChangePassword?: () => void
  onSendResetLink?: () => void
  onDelete?: () => void
  rowActionsBusy?: boolean
  onMenuOpenChange?: (open: boolean) => void
}

type MenuItemProps = {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}

function MenuItem({ icon, label, onClick, disabled, destructive }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors disabled:opacity-40',
        destructive
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-50',
      ].join(' ')}
    >
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  )
}

export function AdminContributorRowActions({
  user,
  actionUserId,
  currentUserId,
  onAction,
  onChangePassword,
  onSendResetLink,
  onDelete,
  rowActionsBusy,
  onMenuOpenChange,
}: AdminContributorRowActionsProps) {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPlacement, setMenuPlacement] = useState<'below' | 'above'>('below')

  const busy = actionUserId === user.id
  const actionsBusy = rowActionsBusy === true
  const disabled = busy || actionsBusy
  const isPending = isPendingContributorStatus(user.status)
  const isApproved = user.status === 'approved' && user.role !== 'admin'
  const isAdmin = user.role === 'admin'
  const isRejected = user.status === 'rejected'
  const canManageAccount = isValidContributorUserId(user.id)
  const canDelete = canManageAccount && user.id !== currentUserId
  const canReject = isPending || isApproved
  const showMoreMenu = canManageAccount || canReject

  useEffect(() => {
    onMenuOpenChange?.(menuOpen)
  }, [menuOpen, onMenuOpenChange])

  useEffect(() => {
    return () => {
      onMenuOpenChange?.(false)
    }
  }, [onMenuOpenChange])

  useLayoutEffect(() => {
    if (!menuOpen || !triggerRef.current) {
      return
    }

    const rect = triggerRef.current.getBoundingClientRect()
    const estimatedMenuHeight = 240
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    setMenuPlacement(
      spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow ? 'above' : 'below',
    )
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  function closeMenuAnd(run?: () => void) {
    setMenuOpen(false)
    run?.()
  }

  const primaryAction = (isPending || isRejected)
    ? {
        label: t('admin.userManagement.actions.approve'),
        className: 'admin-user-row-actions__primary admin-user-row-actions__primary--approve',
        icon: <Check className="h-3.5 w-3.5" aria-hidden />,
        onClick: () => onAction({ type: 'approve', user }),
      }
    : isApproved
      ? {
          label: t('admin.userManagement.actions.promote'),
          className: 'admin-user-row-actions__primary admin-user-row-actions__primary--promote',
          icon: <Shield className="h-3.5 w-3.5" aria-hidden />,
          onClick: () => onAction({ type: 'promote', user }),
        }
      : isAdmin
        ? {
            label: t('admin.userManagement.actions.demote'),
            className: 'admin-user-row-actions__primary admin-user-row-actions__primary--demote',
            icon: <ShieldOff className="h-3.5 w-3.5" aria-hidden />,
            onClick: () => onAction({ type: 'demote', user }),
          }
        : null

  return (
    <div className="admin-user-row-actions">
      {primaryAction ? (
        <button
          type="button"
          disabled={disabled}
          onClick={primaryAction.onClick}
          className={primaryAction.className}
        >
          {primaryAction.icon}
          <span>{primaryAction.label}</span>
        </button>
      ) : null}

      {showMoreMenu ? (
        <div
          ref={menuRef}
          className={[
            'admin-user-row-actions__menu-anchor shrink-0',
            menuOpen ? 'admin-user-row-actions__menu-anchor--open' : '',
          ].join(' ')}
        >
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t('admin.userManagement.actions.moreAria')}
            onClick={() => setMenuOpen((open) => !open)}
            className="admin-user-row-actions__more"
          >
            <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
            <span>{t('admin.userManagement.actions.more')}</span>
            <ChevronDown
              className={['h-3 w-3 opacity-60 transition-transform', menuOpen ? 'rotate-180' : ''].join(' ')}
              aria-hidden
            />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className={[
                'admin-user-row-actions__menu',
                menuPlacement === 'above'
                  ? 'admin-user-row-actions__menu--above'
                  : 'admin-user-row-actions__menu--below',
              ].join(' ')}
            >
              {canManageAccount ? (
                <>
                  <MenuItem
                    icon={<KeyRound className="h-3.5 w-3.5" />}
                    label={t('admin.userManagement.actions.password')}
                    disabled={disabled}
                    onClick={() => closeMenuAnd(onChangePassword)}
                  />
                  <MenuItem
                    icon={<Mail className="h-3.5 w-3.5" />}
                    label={t('admin.userManagement.actions.resetLink')}
                    disabled={disabled}
                    onClick={() => closeMenuAnd(onSendResetLink)}
                  />
                </>
              ) : null}

              {canReject ? (
                <>
                  {canManageAccount ? <div className="my-1 border-t border-slate-100" role="separator" /> : null}
                  <MenuItem
                    icon={<X className="h-3.5 w-3.5" />}
                    label={t('admin.userManagement.actions.reject')}
                    disabled={disabled}
                    destructive
                    onClick={() => closeMenuAnd(() => onAction({ type: 'reject', user }))}
                  />
                </>
              ) : null}

              {canDelete ? (
                <>
                  <div className="my-1 border-t border-slate-100" role="separator" />
                  <MenuItem
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    label={t('admin.userManagement.actions.delete')}
                    disabled={disabled}
                    destructive
                    onClick={() => closeMenuAnd(onDelete)}
                  />
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {disabled ? (
        <span className="admin-user-row-actions__busy" role="status">
          {t('admin.userManagement.actions.processing')}
        </span>
      ) : null}
    </div>
  )
}
