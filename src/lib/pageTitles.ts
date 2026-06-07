export function getSectionTitle(pathname: string): string {
  if (pathname === '/dashboard') {
    return 'Dashboard'
  }

  if (pathname === '/new-coin') {
    return 'New Coin'
  }

  if (pathname === '/my-submissions') {
    return 'My Submissions'
  }

  if (/^\/my-submissions\/\d+\/edit$/.test(pathname)) {
    return 'Edit Submission'
  }

  if (/^\/my-submissions\/\d+$/.test(pathname)) {
    return 'Submission Detail'
  }

  if (pathname === '/profile') {
    return 'Profile'
  }

  if (pathname === '/admin/approve') {
    return 'Approve Contributors'
  }

  return 'CoinArchive'
}
