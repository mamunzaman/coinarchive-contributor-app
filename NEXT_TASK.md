# Next Task

## Current Goal
Wire WordPress admin review API endpoints (`/admin/submissions`, approve/reject).

## Verify Next
- Review step shows "Checking coin uniqueness..." before results
- No duplicate result stays visible as green "No duplicate found"
- Duplicate/error states remain non-blocking and update after SEO title edits
- New Coin form on slow network: obverse/reverse show skeleton + "Loading default image…" before fade-in
- Upload/replace/remove custom images still works; submit payload unchanged
- Catalogue preview + specimen sidebar + review step show same loading behavior
- Edit submission with existing images: no skeleton flash on load (existing source)
- New Coin: select obverse → Use default → preview returns to WordPress default; submit omits obverse_image
- Edit: select replacement → Use current image → preview restores saved image
- Edit: Remove image on existing custom → preview shows default + backend notice (preview-only)
- Card heights stay aligned with clear button spacer
- Admin About/Specifications cards end at content — no blank stretch to sidebar height
- 1280px+ sidebar sticky; main cards `h-fit` / `items-start` on all detail grids