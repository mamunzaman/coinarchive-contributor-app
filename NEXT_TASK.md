# Next Task

## Current Goal
Manual smoke-test UI language vs content language separation.

## Verify Next
- New coin defaults content language to Deutsch; UI switcher does not change it
- Switch UI to EN → content language stays Deutsch; review shows "Content language: German"
- Change content language to English → review updates; country slug unchanged
- `content_language` sent in FormData on submit (backend may ignore until supported)
- Existing submissions without field load as `de`
