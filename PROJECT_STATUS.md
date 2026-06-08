# CoinArchive Contributor App — Project Status

## Completed Features
- [x] React + Vite + TypeScript scaffold
- [x] Tailwind CSS with premium collector theme
- [x] Routing: `/register`, `/login`, `/dashboard`, `/new-coin`
- [x] Layout shell with header and auth layout
- [x] Role-aware route guards (admin `/admin/approve`, approved session required)
- [x] Profile page with account, permissions, and session cards
- [x] Header account menu with role badge, profile, and logout
- [x] New Coin form connected to `/submit-coin` with Bearer token and FormData upload
- [x] My Submissions page at `/my-submissions`
- [x] Submission detail page at `/my-submissions/:id`
- [x] Edit pending submission at `/my-submissions/:id/edit`
- [x] Full ACF coin fields on New Coin, Edit, and Detail (Core, Specifications, Descriptions)
- [x] Country, denomination, and coin type loaded from WP taxonomies with Other fallback
- [x] Admin status controls and gallery upload on New Coin, Edit, and Detail
- [x] Mint Information section on coin forms and detail page
- [x] Archival wizard layout for New Coin and Edit Submission (focus mode, stepper, preview panel)
- [x] MainLayout route switch ensures wizard pages bypass dashboard header
- [x] My Submissions archive gallery with search, filter, sort, and table toggle
- [x] CoinEuropa Archive brand design system (teal primary, editorial neutrals)
- [x] Dashboard wired to real `/my-submissions` data (stats, recent list, quick actions)
- [x] Responsive sidebar shell with top utility bar (desktop/iPad/mobile drawer)
- [x] Desktop/iPad usability pass (sidebar, dashboard, submissions, wizard, form controls)
- [x] Editorial catalogue layout for Submission Detail page
- [x] Mint variant mint mark code dropdown (Berlin, Munich, Stuttgart, Karlsruhe, Hamburg)
- [x] Inline image editing on Submission Detail page (pending submissions)
- [x] Auto-save live image updates on Submission Detail (obverse, reverse, gallery)
- [x] Gallery replace, remove-from-gallery, and admin permanent delete (Edit Wizard + Detail)
- [x] Delete submission action (detail + My Submissions list)
- [x] Unsaved changes guard (wizard forms + navigation)
- [x] Detail image edit blocks delete until Done
- [x] Lucide icon actions across dashboard and submissions UI
- [x] Form autosave draft (localStorage, per submission ID, 10s interval)
- [x] Duplicate coin warning (country/year/denomination/type, non-blocking)
- [x] Image quality checklist + catalogue readiness score (live sidebar)
- [x] Review Submission wizard step before submit
- [x] Field help tooltips (mint, mintage, edge, material, weight, diameter, designer/theme)
- [x] Save draft + dashboard saved drafts (local + server draft status)
- [x] Admin revision notes UI (detail, edit, dashboard-ready types)
- [x] Image cropper (react-easy-crop) for obverse/reverse/gallery
- [x] Contributor statistics on Profile page
- [x] Submission timeline on detail page
- [x] Live catalogue preview card on New/Edit coin wizard
- [x] Dashboard Activity Center + Quality Alerts
- [x] Revision comparison (needs revision submissions)
- [x] Live coin ID preview on core identity step
- [x] Submission activity timeline from WP activity_logs API
- [x] Image cropper controls (zoom, rotation, fit, 1:1/free, live preview)
- [x] Compact gallery cards with overlay icon actions + Add & crop tile
- [x] Free crop with resizable stencil (react-advanced-cropper)
- [x] Edit wizard save actions in page header (Save draft / Save changes)
- [x] Edit wizard save actions duplicated in footer for bottom-of-page access
- [x] Edit wizard compact sticky action bar + smart header save visibility
- [x] `coin_historical_background` ACF field (form, API payload, detail/review, safe HTML display)
- [x] `coin_gallery_ids` audit gap patches (revision detection, meta clear, delete ordering)
- [x] Status/visibility field patches (review summary, revision comparison, admin gating, activity logs)
- [x] React year range validation (500 … current year + 1)
- [x] Taxonomy fields: list-only select (no Other), option whitelist validation
- [x] Submission flow UX hardening (double-submit guard, review taxonomy, inline edit success)
- [x] Sticky wizard step tabs on tablet/desktop (horizontal nav below header)
- [x] Tablet sticky toolbar polish (compact header, tab spacing, scroll-mt)
- [x] Tablet wizard tab touch polish (48px pills, bolder type, active lift, fade hint)
- [x] Tablet fixed bottom action bar (edit + new coin, safe-area, content padding)
- [x] Image crop modal tablet layout (viewport-constrained, sticky footer, compact preview)
- [x] Image crop modal initial fit-to-view (full image visible on open, Fit/Reset)
- [x] Gallery touch actions (always-visible remove on tablet, corner button, a11y labels)
- [x] Obverse/reverse thumbnail previews in image fields
- [x] `stepCompletion.ts` — per-section complete/attention/empty logic
- [x] `WizardStatusBar` — SaaS productivity strip in coin entry wizard
- [x] Wizard step nav completion indicators (tablet pills + lg sidebar, a11y labels)
- [x] `ImageWorkspaceSummary` — compact obverse/reverse/gallery strip below status bar
- [x] Wizard productivity panel from `lg` (form + narrow sticky sidebar; left stepper `xl+` only)
- [x] 1024px wizard layout polish (inset status bar/tabs/footer, wider form column)

## In Progress
- [ ] SaaS data entry Phase 2 (autosave on step change, duplicate sidebar panel)

## Pending Tasks
- [ ] SaaS Phase 1: sticky productivity layout at lg+
- [ ] SaaS Phase 2: autosave on step change, duplicate sidebar panel
- [ ] SaaS Phase 3: admin review split view, bulk editing
- [ ] Required-field validation patches (WP image required)
- [ ] Gallery reorder (if product needs it)
- [ ] Connect profile edit API
- [ ] WordPress plugin integration (embed/build)
- [ ] Backend admin revision notes + timeline date fields (static fallback when no activity_logs)

## Last Update
2026-06-07 — 1024px SaaS wizard layout polish
