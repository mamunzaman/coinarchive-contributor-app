# Next Task

## Current Goal
Manual QA full gallery lifecycle per stress test checklist.

## Verify Next
- Delete confirm: tile Removing overlay + header Removing (not Saving), tile gone on success, Images saved
- In-flight block: second upload before first finishes — amber notice, no extra tile
- Delete 1st/2nd/last with Removing overlay
- Undo delete restores tile, no stuck header
- Upload failure + delete failure show error state
- Stress: upload → upload → delete → undo → upload
