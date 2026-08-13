# FIREWATCH v1.5.1 Validation

Validation performed for the Batch 8 map-loader hotfix.

## Root cause fixed

The v1.5.0 Leaflet loader fetched the Leaflet JavaScript as text and then executed it with `eval()`. That introduced two failure modes even on a connected computer: host Content Security Policy can reject dynamic evaluation, and MAP could render while the asynchronous fetch path was still pending.

v1.5.1 removes the text/eval execution path. `vendor/leaflet-loader.js` now creates ordinary browser script elements and tries sources sequentially:

1. `./vendor/leaflet.js`
2. unpkg Leaflet 1.9.4
3. jsDelivr Leaflet 1.9.4
4. cdnjs Leaflet 1.9.4

MAP reports `LOADING MAP ENGINE` while that sequence is active and only reports `UNAVAILABLE` after every source fails. A `RETRY MAP ENGINE` action is then available.

## Passed

- `index.html` parses with Python `HTMLParser`.
- `FIREWATCH.html` parses with Python `HTMLParser`.
- Main inline application JavaScript passes `node --check`.
- `vendor/leaflet-loader.js` passes `node --check`.
- Loader fallback regression passed in a mocked browser DOM: missing local vendor source failed, UNPKG succeeded, status resolved `ok=true`, `source=UNPKG`, `version=1.9.4`.
- Loader contains no JavaScript `eval()` execution path.
- Optional `meshtastic_bridge.py` passes Python bytecode compilation.
- Visible/internal application version is `1.5.1`.
- Existing primary storage key remains `firewatch.nobuild.v1.1`; the hotfix does not intentionally clear or fork station data.
- Existing recovery key remains unchanged so Batch 8 recovery snapshots remain available.

## Not validated in this environment

- A live request to each public CDN from the generated artifact runtime; the container has no general outbound DNS path.
- Live OSM tile retrieval.
- Physical Meshtastic RF behavior.

The browser loader regression verifies sequencing and recovery behavior independently of external network availability.
