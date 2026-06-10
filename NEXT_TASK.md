# Next Task

## Current Goal
Deploy `feature/fix-auth-me-refresh` to production and verify session survives refresh.

## Verify Next
- Contributor + admin: login → refresh → stay on dashboard/admin
- Invalid /auth/me (no contributor) clears session and sends to login
- My Submissions loads with Bearer after refresh
