# FIREWATCH v1.0.0 — Batch 4 Validation

Validation performed in the build sandbox during the 2026-08-12 / 2026-08-13 session.

## Passed

### TypeScript / application source

- 41 TypeScript/TSX source files syntax-transpiled with the TypeScript compiler API.
- Result: **0 syntax failures**.
- Full `src/` structural type check passed using temporary local declarations for unavailable React/Dexie/MapLibre packages.
- New v1.0 network/sync/field modules included in the structural check.

### Python services

`python -m py_compile` passed for:

- `radio-bridge/bridge.py`
- `weather-bridge/bridge.py`
- `sync-server/server.py`

### Reference sync server runtime

Local runtime smoke test passed:

1. `GET /health` returned `ok: true`.
2. Tower A pushed an INCIDENT record.
3. Server accepted exactly one record.
4. Dispatch pulled from cursor 0.
5. Pulled event retained:
   - entity type
   - entity ID
   - update timestamp
   - payload
   - origin station
6. `nextCursor` advanced correctly.

### FWP/1 regression

- encoded packet length: **27 bytes**
- report ID round-trip: `A72F91`
- bearing round-trip: `247.3°`
- range round-trip: `14830 m`

### Service worker

- cache namespace verified as `firewatch-v1.0.0`
- navigation fallback remains available
- cross-origin requests are excluded from application cache handling

### Python/SQLite dependency boundary

The reference sync server uses Python standard-library HTTP + `sqlite3`; it has no required third-party Python package.

## Schema / migration review

IndexedDB schema advances from v4 to **v5**.

Added tables:

- `fieldUpdates`
- `stationPresence`
- `syncConflicts`
- `syncStatus`

The v5 migration adds defaults for:

- `stationRole`
- `stationId`
- `syncEnabled`
- `syncServerUrl`
- `syncIntervalSeconds`
- `sharePresence`
- `fieldPositionMode`

Backup import also injects those defaults when importing earlier FIREWATCH backups.

## Dependency-resolved production build

The sandbox does not contain the project npm dependencies. A full dependency-resolved Vite production build was therefore not performed here.

Run on the deployment machine:

```bash
npm install
npm run build
```

No `dist/` directory is included in the ZIP.

## Recommended field acceptance checks

1. Open an existing v0.8 station and confirm schema migration to v5.
2. Export/import a v1.0 backup and confirm all new tables restore.
3. Start the sync server and configure two browser profiles with different station IDs.
4. Create an incident at Lookout A and verify it appears at Dispatch after sync.
5. Disconnect the sync server, create additional local records, reconnect, and verify recovery.
6. Deliberately create equal-timestamp divergent incident data and verify it enters NETWORK → CONFLICTS rather than being silently overwritten.
7. From FIELD mode, record ON SCENE and FIRE LOCATED updates.
8. Use device GPS on an HTTPS/localhost deployment and confirm explicit permission behavior.
9. Send CORRECT LOCATION and confirm FIELD CREW provenance appears on the incident.
10. Disconnect Starlink/Internet and confirm WATCH, MAP, sightings, incident evidence, local reports, terrain, and Meshtastic workflows remain usable.
11. Validate real Meshtastic hardware on the intended radios/firmware.
12. Verify offline map strategy for the actual operating region.
13. Inspect NETWORK → DIAGNOSTICS storage quota on the intended browser/device.
14. Generate incident, shift, and handoff PDFs in the target browser/OS.
15. Review local procedures, contacts, security controls, and deployment networking against agency requirements before operational use.
