import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Plus,
  ShieldCheck,
  User,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext'
import { clearAuthSession, getContributorRole, isApprovedSession } from '../../lib/auth'
import { ICON_NAV } from '../ui/ActionControls'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
      <Icon className={ICON_NAV} />
    </span>
  )
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/new-coin', label: 'New Coin', icon: Plus },
  { to: '/my-submissions', label: 'My Submissions', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: User },
]

function sidebarLinkClass(isActive: boolean) {
  return [
    'flex min-h-12 items-center gap-3 rounded-r-lg border-l-[3px] text-sm font-medium transition-colors',
    'px-3 py-3 md:justify-center lg:justify-start lg:px-4',
    isActive
      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/10'
      : 'border-transparent text-navy-muted hover:border-primary/25 hover:bg-primary/5 hover:text-navy',
  ].join(' ')
}

type AppSidebarProps = {
  mobileOpen: boolean
  onNavigate: () => void
}

export function AppSidebar({ mobileOpen, onNavigate }: AppSidebarProps) {
  const navigate = useNavigate()
  const { isDirty, requestNavigation } = useUnsavedChanges()
  const role = isApprovedSession() ? getContributorRole() : 'contributor'
  const items: NavItem[] =
    role === 'admin'
      ? [...navItems, { to: '/admin/approve', label: 'Approve', end: true, icon: ShieldCheck }]
      : navItems

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200',
        'md:static md:z-auto md:w-[72px] md:translate-x-0 lg:w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}
      aria-label="Main navigation"
    >
      <div className="border-b border-border/60 px-4 py-6 md:px-2 lg:px-4">
        <NavLink
          to="/dashboard"
          onClick={(event) => {
            if (isDirty) {
              event.preventDefault()
              requestNavigation('/dashboard')
            }
            onNavigate()
          }}
          className="flex items-center gap-3"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-serif text-lg font-semibold text-primary">
            CE
          </span>
          <span className="min-w-0 md:hidden lg:block">
            <span className="block font-serif text-base font-semibold leading-tight text-navy">
              CoinEuropa
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-muted">
              Archive
            </span>
          </span>
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1.5 px-2 py-5 lg:px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            aria-label={item.label}
            onClick={(event) => {
              if (isDirty) {
                event.preventDefault()
                requestNavigation(item.to)
              }
              onNavigate()
            }}
            className={({ isActive }) => sidebarLinkClass(isActive)}
          >
            <NavIcon icon={item.icon} />
            <span className="truncate md:hidden lg:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3">
        <button
          type="button"
          onClick={() => {
            clearAuthSession()
            onNavigate()
            navigate('/login', { replace: true })
          }}
          title="Logout"
          aria-label="Logout"
          className="flex min-h-12 w-full items-center gap-3 rounded-r-lg border-l-[3px] border-transparent px-3 py-3 text-sm font-medium text-navy-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 md:justify-center lg:justify-start lg:px-4"
        >
          <NavIcon icon={LogOut} />
          <span className="md:hidden lg:inline">Logout</span>
        </button>
      </div>
    </aside>
  )
}
