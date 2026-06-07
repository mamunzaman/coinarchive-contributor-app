import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clearAuthSession, getContributorRole, isApprovedSession } from '../../lib/auth'

type NavItem = {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
      {children}
    </span>
  )
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M10.707 1.293a1 1 0 0 0-1.414 0l-8 8A1 1 0 0 0 2 10h1v7a1 1 0 0 0 1 1h4v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V18h4a1 1 0 0 0 1-1v-7h1a1 1 0 0 0 .707-1.707l-8-8Z" />
      </svg>
    ),
  },
  {
    to: '/new-coin',
    label: 'New Coin',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
      </svg>
    ),
  },
  {
    to: '/my-submissions',
    label: 'My Submissions',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h11A2.5 2.5 0 0 1 18 4.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 2 15.5v-11ZM4.5 3.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-11a1 1 0 0 0-1-1h-11Z" />
        <path d="M6 6.75A.75.75 0 0 1 6.75 6h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 6 6.75ZM6 10a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 6 10Zm0 3.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75Z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 16.75a5.5 5.5 0 0 1 11 0 .75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75Z" />
      </svg>
    ),
  },
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
  const role = isApprovedSession() ? getContributorRole() : 'contributor'
  const items =
    role === 'admin'
      ? [
          ...navItems,
          {
            to: '/admin/approve',
            label: 'Approve',
            end: true,
            icon: (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10 2a4 4 0 0 0-4 4v1H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4Zm-2.5 5V6a2.5 2.5 0 0 1 5 0v1h-5Z" />
              </svg>
            ),
          },
        ]
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
        <NavLink to="/dashboard" onClick={onNavigate} className="flex items-center gap-3">
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
            onClick={onNavigate}
            className={({ isActive }) => sidebarLinkClass(isActive)}
          >
            <NavIcon>{item.icon}</NavIcon>
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
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M3 4.75A1.75 1.75 0 0 1 4.75 3h4.5a.75.75 0 0 1 0 1.5h-4.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h4.5a.75.75 0 0 1 0 1.5h-4.5A1.75 1.75 0 0 1 3 15.25V4.75Zm11.47 2.97a.75.75 0 0 1 1.06 0l2.75 2.75a.75.75 0 0 1 0 1.06l-2.75 2.75a.75.75 0 0 1-1.06-1.06l1.47-1.47H8.75a.75.75 0 0 1 0-1.5h7.19l-1.47-1.47a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </NavIcon>
          <span className="md:hidden lg:inline">Logout</span>
        </button>
      </div>
    </aside>
  )
}
