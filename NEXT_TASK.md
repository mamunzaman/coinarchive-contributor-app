# Next Task

## Current Goal
Manual smoke-test contributor edit image UI (replace/remove gallery, save warnings).

## Verify Next
- Edit submission Images step: replace obverse/reverse preview, remove + undo, gallery add/remove
- Save sends `replace_*`, `remove_*_ids[]`, `gallery_images[]` in FormData
- Blocked media deletion shows amber warning after successful save
- Empty submission images does not crash
