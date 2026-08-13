# FIREWATCH v1.0.0 — Distributed Wildfire Observation & Lookout Operations System

FIREWATCH is a local-first, offline-capable operational web application for remote fire lookout towers, cooperating lookouts, dispatch, ranger stations, and field crews.

> **SEE IT. LOCATE IT. SHARE IT. KEEP WATCH.**

The v1.0 release completes the original roadmap through multi-station synchronization, field crew workflows, dispatch views, recovery hardening, diagnostics, and deployment documentation while retaining all earlier Fire Finder, triangulation, Meshtastic/FWP, horizon, lightning, terrain, weather, reporting, and tower-operations capabilities.

## Operating model

```text
PREPARE → SCAN → OBSERVE → LOCATE → ASSESS → SHARE
        → TRIANGULATE → REPORT → RESPOND → MONITOR → HAND OFF
```

Internet connectivity is optional. The local browser database remains usable when Starlink, cellular, sync services, or the Meshtastic bridge are unavailable.

---

## v1.0 / Batch 4

### Multi-station sync

The new **NETWORK** workspace provides optional LAN/Internet synchronization between FIREWATCH stations.

Replicated records are intentionally limited to incident-centric operational data:

- incidents
- observations
- bearing evidence
- rechecks/watch items
- radio log entries
- shift chronology
- field updates
- optional station presence

FIREWATCH does **not** replicate the complete IndexedDB database. Terrain samples, panoramas, procedures, full weather history, and generated reports remain local unless exported explicitly.

Sync behavior:

- append/version oriented
- idempotent re-sends
- cursor-based pull
- store-and-forward behavior after outages
- clear local/remote provenance
- optional station presence
- explicit error/failure state
- no requirement for a cloud account

### Conflict inbox

Equal-version divergent records are not silently merged.

**NETWORK → CONFLICTS** stores both payloads and requires an explicit operator decision:

- Keep local
- Accept remote

Clearly newer remote records can advance local state. Older remote records do not replace newer local state.

### Reference sync server

`sync-server/` contains a dependency-free Python + SQLite reference service.

```bash
cd sync-server
python server.py
```

Default endpoint:

```text
http://127.0.0.1:8790
```

LAN deployment:

```bash
python server.py --host 0.0.0.0 --port 8790
```

The server is optional. FIREWATCH remains locally operational without it.

See `SYNC_PROTOCOL.md` and `DEPLOYMENT.md`.

### Station roles

FIREWATCH supports role metadata for:

- LOOKOUT
- DISPATCH
- FIELD_CREW
- RANGER_STATION

Role changes do not create separate incompatible databases; every station uses the same incident/evidence model.

### Field crew mode

**NETWORK → FIELD** provides a mobile-oriented incident workflow.

A crew can:

- select an active incident
- see bearing and range to the incident from its current/manual position
- enter manual coordinates
- request browser device GPS explicitly
- record GPS accuracy
- send:
  - ON SCENE
  - FIRE LOCATED
  - NO FIRE FOUND
  - CORRECT LOCATION
  - STATUS / update
- attach notes
- create timestamped field evidence

A `CORRECT LOCATION` update can update the incident location with explicit **FIELD CREW** provenance.

### Dispatch view

**NETWORK → DISPATCH** shows:

- all active incidents
- status and urgency
- most recent field update per incident
- synchronized station presence

This is intentionally a compact operational board, not a replacement for agency CAD/incident-command systems.

### Hybrid communications model

FIREWATCH now supports complementary transports:

```text
MESHTASTIC / FWP    compact observation + bearing traffic
OPTIONAL SYNC       richer incident/state/field replication
LOCAL DATABASE      always available operational record
```

Neither Internet sync nor Meshtastic is required for the other to function.

---

## v1.0 hardening

### IndexedDB schema v5

New local tables:

```text
fieldUpdates
stationPresence
syncConflicts
syncStatus
```

Backups now export as:

```text
FIREWATCH_BACKUP v1.0.0
```

Older FIREWATCH settings/backups are upgraded with safe defaults for the new sync and role settings.

### Recovery boundary

A React recovery boundary prevents an interface-render failure from intentionally clearing local project data. The recovery screen recommends reload/recovery rather than destructive reset.

### Service worker hardening

The v1.0 service worker:

- uses cache namespace `firewatch-v1.0.0`
- cleans obsolete FIREWATCH caches
- keeps navigation fallback offline
- caches same-origin application assets
- does not attempt to cache cross-origin sync/API traffic

### Diagnostics

**NETWORK → DIAGNOSTICS** exposes:

- browser online/offline state
- approximate browser storage usage/quota
- service-worker support
- sync configuration
- sync-server verification
- unresolved conflict count
- field-update count
- backup format version

### Accessibility / field ergonomics

v1.0 adds:

- keyboard-accessible skip link
- reduced-motion handling
- responsive field/dispatch layouts
- large field action controls
- explicit text labels in addition to status color
- horizontally safe top navigation on smaller screens

---

## Core capabilities retained

### WATCH

- current tower/shift state
- latest weather + provenance/freshness
- active sightings/incidents
- recheck queue
- lightning watch count
- scan freshness
- rapid New Sighting / Radio / Scan workflows

### Fire Finder / triangulation

- Osborne-style bearing input
- vertical angle
- bearing/range uncertainty
- probable-origin corridor
- terrain-derived range candidate
- two-or-more-tower weighted least-squares triangulation
- uncertainty ellipse
- geometry quality
- residuals and possible outlier display
- raw observation retained separately from derived location

### Meshtastic / FWP

- FWP/1 compact binary protocol
- 27-byte standard observation/bearing packet
- simulated mesh
- real Python Meshtastic radio bridge
- serial/TCP Meshtastic connection
- broadcast observation
- directed bearing request
- directed bearing response
- transport delivery vs operational acknowledgment separation
- persistent bridge outbound queue
- duplicate-safe receive handling

### Horizon

- calibrated panorama
- start bearing/angular span
- projected landmarks
- manual annotations
- SMOKE HERE → normal observation workflow

### Lightning + rechecks

- manual/CSV lightning import
- clustering
- delayed ignition watch
- recheck cadence
- LOOK HERE
- clear/obscured/smoke/fire results
- automatic requeue when obscured

### Terrain / viewshed

- CSV elevation samples
- GeoJSON elevations
- ESRI ASCII Grid DEM
- offline line-of-sight
- obstruction estimate
- Fire Finder terrain intersections
- coarse modeled viewshed overlay

### Weather / local sensors

- manual weather
- local sensor JSON adapters
- remote JSON adapters
- provenance labels
- freshness/stale handling
- temperature/RH/wind/gust/pressure/precipitation/visibility/cloud cover
- visibility landmarks
- local dependency-free weather bridge
- weather evidence attached to sightings

### Tower operations

- explicit shifts
- handoff notes
- equipment state
- maintenance history
- offline procedures/checklists
- offline contacts
- incident reports
- shift reports
- handoff reports
- local PDF generation
- JSON evidence packages

---

## Development

Requirements:

- Node.js 20+
- npm

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm run preview
```

## Optional services

### Meshtastic bridge

```bash
cd radio-bridge
python -m pip install -r requirements.txt
python bridge.py
```

### Weather bridge

```bash
cd weather-bridge
python bridge.py
```

### Sync server

```bash
cd sync-server
python server.py
```

---

## Project structure

```text
src/
  firefinder/
  horizon/
  lightning/
  map/
  mesh/
  network/          multi-station / field / dispatch UI
  observations/
  protocol/         FWP/1
  radio/
  reports/
  scans/
  storage/
  sync/             browser replication client
  terrain/
  tower/
  triangulation/
  weather/

radio-bridge/       Meshtastic host bridge
weather-bridge/     local weather observation bridge
sync-server/        optional Python + SQLite station sync
samples/
```

## Privacy

FIREWATCH contains no analytics, advertising, mandatory telemetry, or mandatory cloud account. Remote synchronization is disabled by default and must be explicitly configured.

## Operational boundary

FIREWATCH is an observation, communications, mapping, evidence, and coordination instrument. It does not replace agency dispatch procedures, incident command, trained wildfire personnel, validated fire-behavior systems, evacuation authority, or approved radio procedures.
