# FIREWATCH v1.5.2

**Distributed Wildfire Observation & Lookout Operations System**  
**Batch 8 — Field Hardening**

FIREWATCH is a local-first browser instrument for fire lookout towers, cooperating lookouts, dispatch, and field crews.

**PREPARE → SCAN → OBSERVE → LOCATE → SHARE → TRIANGULATE → MONITOR → HAND OFF**

> Help the lookout look outside more, not look at the computer more.

## No compile

FIREWATCH remains a direct-upload application.

There is no React, TypeScript, Vite, npm install, transpilation, or build command. Upload the package contents to a static directory and open `index.html`.

## v1.5.2 map loader repair

Batch 8 originally fetched Leaflet as text and executed it with `eval()`. That could fail under a host Content Security Policy even when the browser had Internet access. v1.5.2 removes `eval()` completely. The local loader now tries normal script elements in this order: `vendor/leaflet.js`, unpkg, jsDelivr, then cdnjs. MAP distinguishes `LOADING` from `UNAVAILABLE` and provides a RETRY MAP ENGINE action after a hard failure.

For the most resilient tower deployment, place the official Leaflet 1.9.4 distribution file at `vendor/leaflet.js`; the app will use it before any network source.

## Batch 8 highlights

### Shift workflow

- prominent ACTIVE / INACTIVE shift state on WATCH
- START SHIFT with operator identity
- optional opening checklist
- END SHIFT with unresolved-incident/recheck/mesh summary
- handoff notes and PDF generation
- shift history under **TOWER → SHIFT**

### Recovery hardening

- checksum-verified local recovery snapshots
- timed snapshots and page-hide snapshots
- snapshot before START FRESH, NEW STATION, and imports
- recovery snapshot after import
- manual recovery creation and restore
- primary storage is not intentionally cleared by startup failures
- older FIREWATCH v1.1–v1.4 state continues using the established primary storage key

See `RECOVERY.md`.

### Diagnostics

**TOWER → DIAGNOSTICS** shows:

- application/version
- local storage use
- map-engine status/source
- basemap mode
- mesh bridge/pending queue/nodes
- weather record count
- current shift
- recovery snapshots

Diagnostic state can be exported as JSON.

### Field controls

The header now includes **FIELD SIZE**. It increases control and input sizes for touch/tablet use without changing the underlying data model.

Daylight/night appearance remains available with the theme control.

### Two-lookout field-test runner

**TOWER → FIELDTEST** provides a 14-step PASS/FAIL test for the complete Mesh/FWP workflow, including OBS, REQUEST BEARING, triangulation, transport ACK, operations ACK, deliberate radio loss, queueing, reconnect, and handoff.

See `FIELD_TEST.md`.

### Offline map preparation

FIREWATCH still uses Leaflet 1.9.4 and the same geographic workflow introduced earlier.

- Leaflet CSS is included locally.
- A local `vendor/leaflet.js` is preferred when present.
- Otherwise the map loader can cache Leaflet 1.9.4 after a connected preparation/first load.
- **TOWER → DIAGNOSTICS → PREPARE MAP ENGINE** explicitly refreshes that cache.
- Local XYZ tiles remain supported.
- No basemap mode remains available.

For a first-ever cold start with no Internet, put the official Leaflet 1.9.4 `leaflet.js` distribution file at `vendor/leaflet.js` before deployment. This is a file-copy operation, not compilation.

See `OFFLINE_MAP.md` and `LOCAL_TILES.md`.

## Core capabilities retained

- WATCH dashboard and NEXT LOOK prioritization
- rapid SMOKE/FIRE bearing-first observation entry
- Leaflet operational map
- OSM / local XYZ / no-basemap modes
- station and neighboring-lookout editor
- landmarks and persistent GeoJSON layers
- Fire Finder bearing/range plotting
- uncertainty corridors and incident ellipses
- multi-lookout weighted triangulation
- raw measurement/residual/outlier evidence
- lightning import, clustering, and delayed rechecks
- calibrated horizon references and visibility observations
- weather evidence and incident/weather chronology
- incident lifecycle and PDF reporting
- radio and shift logs
- FWP/1 27-byte packet format
- Meshtastic bridge mode and simulator
- retry queue and duplicate suppression
- REQUEST BEARING / response workflow
- radio ACK vs human operations ACK
- JSON backup/import
- START FRESH and NEW STATION

## Deployment

Upload the folder directly, for example:

```text
/public_html/projects/firewatch/
  index.html
  FIREWATCH.html
  vendor/
  examples/
  ...
```

Then browse to `index.html`.

For best offline behavior, serve FIREWATCH from a stable HTTP/HTTPS origin rather than changing URLs between sessions. Browser storage and Cache Storage are origin-specific.

## Meshtastic bridge

The main browser app remains usable without a bridge. The optional `meshtastic_bridge.py` connects the FIREWATCH WebSocket protocol to Meshtastic serial/TCP interfaces.

See `MESH_BRIDGE.md`.

## Privacy

FIREWATCH has no analytics, ads, mandatory cloud account, or automatic telemetry. Operational state is stored in the browser unless explicitly exported or transmitted through a configured bridge/network path.

## Safety boundary

FIREWATCH is an observation, mapping, communications, evidence, and coordination aid. It does not replace agency dispatch procedures, incident command, trained wildfire personnel, official fire-behavior models, authoritative weather/GIS products, evacuation authority, or validated radio procedures.

## Files

- `index.html` — direct deployment entry point
- `FIREWATCH.html` — equivalent named copy
- `vendor/leaflet.css` — local Leaflet stylesheet
- `vendor/leaflet-loader.js` — local/cache/network Leaflet runtime loader
- `vendor/LEAFLET-NOTICE.txt` — Leaflet attribution/license
- `meshtastic_bridge.py` — optional radio bridge
- `MESH_BRIDGE.md` — bridge setup
- `LOCAL_TILES.md` — local tile packaging
- `OFFLINE_MAP.md` — offline map-engine preparation
- `RECOVERY.md` — backup/recovery behavior
- `FIELD_TEST.md` — two-lookout field test
- `VALIDATION.md` — release validation notes
- `CHANGELOG.md` — release changes

---

**FIREWATCH v1.5.2**  
**SEE IT. LOCATE IT. SHARE IT. KEEP WATCH.**


## v1.5.2 map startup hotfix

The Leaflet loader and Leaflet CSS are embedded directly in `index.html`/`FIREWATCH.html`. Uploading just the HTML file no longer leaves FIREWATCH waiting for a missing `vendor/leaflet-loader.js`. Leaflet JavaScript is loaded with normal script elements from unpkg, jsDelivr, then cdnjs, with a 5-second timeout per source and an explicit failure message. No `eval()` is used.
