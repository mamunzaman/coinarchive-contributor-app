# Next Task

## Current Goal
Manual smoke-test bilingual UI (DE default, EN persistence, translated labels).

## Verify Next
- App opens in German; switch DE/EN in header or auth layout
- Refresh keeps selected language (localStorage `coinarchive_language`)
- Login, dashboard, wizard steps, validation messages translate
- Quality dropdown shows translated labels; saved values stay UNC/BU/Proof/Circulated
- Review country/type display translates; slugs and payloads unchanged
- `npm run build` passes
