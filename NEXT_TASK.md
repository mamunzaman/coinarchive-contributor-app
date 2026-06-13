# Next Task

## Current Goal
Smoke-test API error messages and admin detail lazy sections after performance audit.

## Verify Next
- Disconnect network → dashboard/submissions show friendly error + retry
- Admin detail loads audit/SEO sections with skeleton, no blank screen
- Login/logout still works; transient `/auth/me` failure does not clear session unless 401/403
