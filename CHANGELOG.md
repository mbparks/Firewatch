# FIREWATCH Changelog

## v1.5.0 — Batch 8: Field Hardening

- Added explicit START SHIFT / END SHIFT workflow on WATCH.
- Added operator identity, opening checklist handoff, outgoing notes, unresolved-work summary, and shift history.
- Added checksum-verified local recovery snapshots.
- Added recovery creation before destructive reset/new-station/import operations.
- Added manual recovery restore under TOWER → DIAGNOSTICS.
- Added diagnostic JSON export and storage/map/mesh/weather/shift diagnostics.
- Added persistent FIELD SIZE mode for larger touch/tablet controls.
- Added structured 14-step two-lookout/two-radio field-test runner with PASS/FAIL/evidence notes and JSON export.
- Added offline-prepared Leaflet 1.9.4 loader: local `vendor/leaflet.js` first, Cache Storage second, connected CDN retrieval/cache third.
- Leaflet CSS is now a local file instead of a render-blocking CDN dependency.
- START FRESH / NEW STATION / backup import now preserve a recovery point first.
- Retained FWP/1 wire format and all Batch 5–7 mapping, mesh, lightning, horizon, weather, and triangulation behavior.
