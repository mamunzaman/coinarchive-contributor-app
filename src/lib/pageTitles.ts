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

  if (pathname === '/admin') {
    return 'Admin Dashboard'
  }

  if (pathname === '/admin/submissions') {
    return 'Submission Review Queue'
  }

  if (/^\/admin\/submissions\/\d+$/.test(pathname)) {
    return 'Review Submission'
  }

  if (pathname === '/admin/approve') {
    return 'Approve Contributors'
  }

  if (pathname === '/admin/import') {
    return 'Bulk Import Coins'
  }

  return 'CoinArchive'
}
