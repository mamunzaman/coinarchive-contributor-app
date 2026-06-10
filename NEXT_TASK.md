# Next Task

## Current Goal
Manual smoke-test Gemini AI Writing Assistant endpoint.

## Verify Next
- Add `CAES_GEMINI_API_KEY` in `wp-config.php`
- Test unauthenticated generation returns 401
- Test missing key returns 501
- Test with key populates generated fields
- Confirm browser network never shows the Gemini API key
