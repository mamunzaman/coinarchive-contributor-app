# Next Task

## Current Goal
Verify edit-submission obverse/reverse removal clears image on save (requires WP `remove_obverse_image_ids[]` / `remove_reverse_image_ids[]` handlers).

## Verify Next
- Edit submitted coin → remove obverse → submit → detail shows placeholder/default, not old upload
- Remove then upload new image → new image persists
- Gallery removal still works; draft restore keeps removed flags
