# FIREWATCH v1.5.0 Validation

Validation performed for the Batch 8 field-hardening release.

## Passed

- HTML parsed successfully with Python `HTMLParser`.
- Main inline application JavaScript passes `node --check`.
- `vendor/leaflet-loader.js` passes `node --check`.
- Optional `meshtastic_bridge.py` passes Python bytecode compilation.
- 134 named browser functions found with no duplicate function declarations.
- Visible/internal version updated to `1.5.0`.
- No direct `<script>` or `<link>` tag points at the Leaflet CDN; FIREWATCH loads local `vendor/leaflet.css` and the local map-engine loader.
- Local Leaflet CSS is 14,806 bytes and matches Git blob SHA `2961b7618a57617d1015d31d2094c425c3d86ce9` from the 1.9.4 distribution mirror used for verification.
- FWP/1 OBS encode/decode regression passes at exactly 27 bytes.
- FWP/1 BEARING encode/decode regression passes at exactly 27 bytes and preserves `±0.45°` bearing uncertainty.
- Recovery checksum regression passes: modified state produces a different FNV-1a checksum.
- Static presence checks pass for shift controls, recovery restore, diagnostics, field-test runner, FIELD SIZE mode, local Leaflet CSS, and map-engine loader.
- Existing primary storage key `firewatch.nobuild.v1.1` is retained so earlier no-build FIREWATCH state can migrate forward through `normalizeState()`.

## Batch 8 behavior reviewed

- START SHIFT / END SHIFT create chronological SHIFT log entries.
- Closed shifts are retained in `shiftHistory`.
- START FRESH, NEW STATION, and backup import request a recovery snapshot first.
- Recovery restore creates a snapshot of the current state before replacing it.
- Field-test runs retain per-step PASS/FAIL, timestamp, and evidence note and can export JSON.
- Diagnostics expose application, storage, Leaflet, basemap, mesh, weather, counts, shift, and recovery status.
- FIELD SIZE is persisted in station settings and applied on initial load.
- Leaflet loader order is: optional local `vendor/leaflet.js` → browser-local cached runtime → connected hosted runtime which is cached for later use.

## Not validated in this environment

- Physical two-radio Meshtastic RF behavior.
- Real lookout-tower range/terrain performance.
- Long-duration browser storage behavior with very large panorama images/recovery histories.
- A full interactive browser session with live OSM tiles; this environment does not provide a reliable graphical browser/network path for that test.
- First-ever fully disconnected Leaflet startup with `vendor/leaflet.js`, because the third-party Leaflet JavaScript distribution could not be transferred into the generated artifact by this environment. The package supports the file directly if placed there, and the included preparation workflow caches it after a connected run.

Use **TOWER → FIELDTEST** on the target hardware as the release acceptance test before relying on the radio workflow operationally.
