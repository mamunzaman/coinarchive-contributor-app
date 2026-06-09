# Next Task

## Current Goal
Wire WordPress admin review API endpoints (`/admin/submissions`, approve/reject).

## Verify Next
- Download import XLS → coin_code column present but sample cells empty; import with empty coin_code lets WP generate suffix
- Coin wizard: default obverse/reverse previews from form-options; submit without files omits image fields in FormData
- Admin import preview: columns scroll horizontally without overlap; long title/coin_code truncate with tooltip
- Admin import: parsing spinner on XLSX/CSV upload; duplicate titles block import
- Country dropdown correctly filters rows after selecting any country
- "Reset filters" button appears when any filter/search is active and clears all
