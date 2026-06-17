# Bundle notes (2026-06-15)

## Before → after (gzip)

| Chunk | Before | After | Notes |
|-------|--------|-------|-------|
| `api-*` | 61.65 KB (`api.js`) | 7.28 KB (`api-submissions`) + 3.78 KB (`api-admin`) + 71 KB (`api-coin-tools`, wizard/import only) | Split `src/lib/api.ts` into modules |
| `index` | 325.32 KB | 323.28 KB | Slight reduction |
| `vendor-xlsx` | 424.85 KB | 424.85 KB | Already dynamic in `AdminImportPage` |
| `vendor-tiptap` | 417.38 KB | 417.38 KB | Already lazy via `CoinFormFields` → `RichTextField` |
| `vendor-cropper` | 96.49 KB | 96.49 KB | Already lazy via `ImageCropModal` |
| `SubmissionTimeline` | (in shared ~59 KB) | 1.42 KB own chunk | Lazy in `SubmissionDetailLayout` |
| `submissionTimeline` shared | 59.12 KB | 58.28 KB | Detail page helpers + `api-submissions` |
| `DashboardPage` | 43.25 KB | 43.30 KB | Loads `api-submissions` only |
| `ProfilePage` | 21.40 KB | 23.24 KB | Account activity in `profileApi` |
| `NewCoinPage` | 11.68 KB | 11.74 KB | Unchanged shell; coin tools load on wizard |
| `CoinFormFields` | 93.57 KB | 93.81 KB | `EditableGalleryGrid` now lazy in edit mode |

## Route initial load (lazy pages confirmed)

All major pages use `src/routes/lazyPages.ts` + `Suspense` in `AppRoutes.tsx`.

- `/dashboard` — dashboard shell + `api-submissions` + auth core (not coin tools / xlsx / tiptap)
- `/profile` — profile UI + `profileApi` (not full legacy api monolith)
- `/new-coin` — wizard shell; `CoinFormFields`, TipTap, cropper, coin tools load on step interaction
- `/admin/approve` — admin page + `api-admin` chunk

## Maintenance

`scripts/split-api.mjs` regenerates API modules from a monolithic source if needed. Prefer editing `src/lib/api/*.ts` directly.
