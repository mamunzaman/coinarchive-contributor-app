# Next Task

## Current Goal
Verify WP receives cleanup fields on obverse/reverse/gallery replace.

## Verify Next
- Replace obverse on Detail autosave includes old_obverse_image_id + cleanup_old_attachment=1
- Edit Wizard save with new reverse sends old_reverse_image_id + cleanup
- Gallery replace sends cleanup_old_attachment=1
- New coin first upload does not send cleanup fields
