# FIREWATCH

**Distributed Wildfire Observation & Lookout Operations System**  
**Version 1.1.0 — No-Build / Self-Contained Edition**

FIREWATCH is a local-first browser application for remote fire lookout towers, wildfire observers, dispatch personnel, field crews, and cooperating lookout stations.

Its operational workflow is:

**PREPARE → SCAN → OBSERVE → LOCATE → ASSESS → SHARE → TRIANGULATE → REPORT → MONITOR → HAND OFF**

> **Help the lookout look outside more, not look at the computer more.**

## No-Build Edition

FIREWATCH v1.1.0 is intentionally self-contained.

There is no:

- `npm install`
- compile step
- build step
- React
- TypeScript
- Vite
- MapLibre runtime
- CDN
- external JavaScript
- external CSS
- mandatory server
- mandatory cloud account

The entire application is contained in one HTML file.

Use either:

```text
FIREWATCH.html
index.html
```

Both contain the same application.

## Deployment

Upload `index.html` directly to any static web directory.

Example:

```text
/public_html/projects/firewatch/index.html
```

Then visit the corresponding URL.

**Nothing needs to be compiled before upload.**

`FIREWATCH.html` may also be opened directly from disk. For regular operational use, a stable local or web origin is recommended because browser storage behavior for `file://` pages can vary.

## Major Capabilities

FIREWATCH includes:

- WATCH operational dashboard
- rapid smoke/fire sighting entry
- horizon scan tracking
- recheck / LOOK HERE workflow
- offline operational map
- Fire Finder bearing/range plotting
- bearing and range uncertainty
- multi-lookout weighted triangulation
- uncertainty ellipses
- residual/outlier inspection
- incident lifecycle and evidence
- shift and radio logs
- FWP/1 packet encoding and decoding
- simulated Meshtastic traffic
- optional localhost Meshtastic bridge
- manual weather observations
- optional JSON weather source
- equipment tracking
- offline procedures
- contact/callsign directory
- horizon-image workflow
- lightning observations
- terrain line-of-sight screening
- field crew updates
- incident PDF reports
- shift/handoff PDF reports
- JSON backup/import
- daylight/night modes

## Main Workspaces

### WATCH

The primary lookout operating screen.

WATCH displays current weather, visibility, active incidents, rechecks, horizon scan freshness, and large controls for:

```text
+ NEW SIGHTING
START SCAN
```

### MAP

FIREWATCH uses a dependency-free operational geometry map.

It displays towers, landmarks, bearing rays, incidents, uncertainty ellipses, lightning points, and modeled terrain visibility.

This self-contained edition deliberately does not require Internet basemap tiles.

### INCIDENTS

Sightings can be promoted into incidents with lifecycle states:

```text
SIGHTING
SUSPECTED
REPORTED
CONFIRMED
RESPONDING
MONITORING
CLOSED
```

Incident evidence includes observations, contributing bearings, derived coordinates, uncertainty, geometry quality, residuals, and timeline information.

### LOG

FIREWATCH automatically records important operational events including observations, Fire Finder measurements, incident changes, radio traffic, mesh traffic, weather observations, equipment changes, rechecks, and field updates.

Manual log entries are also supported.

### TOWER

Tower operations include:

```text
WEATHER
EQUIPMENT
PROCEDURES
CONTACTS
HORIZON
```

Backup/import and Fresh Start controls are also located here.

### NETWORK

NETWORK provides:

- FWP/1 encoder/decoder
- simulated mesh transmission
- packet ledger
- optional WebSocket Meshtastic bridge
- station roles
- field crew updates

Supported station roles:

```text
LOOKOUT
DISPATCH
FIELD_CREW
RANGER_STATION
```

## Recording a Sighting

Choose:

**WATCH → + NEW SIGHTING**

Only a bearing is strictly required to establish the geographic observation direction. FIREWATCH encourages:

**CAPTURE NOW → REFINE LATER**

Observation fields include bearing, bearing uncertainty, type, confidence, urgency, optional range, range uncertainty, vertical angle, notes, and useful observation flags.

## Fire Finder

The MAP workspace provides Fire Finder-style entry for:

```text
Tower
Bearing / Azimuth
Bearing uncertainty
Range
Range uncertainty
Vertical angle
```

When an incident is selected, new bearing measurements become incident evidence.

## Triangulation

FIREWATCH supports weighted triangulation from two or more lookout bearings.

The resulting analysis includes:

- estimated latitude/longitude
- GOOD / FAIR / POOR geometry
- RMS bearing residual
- uncertainty estimate
- uncertainty ellipse
- predicted bearing from each tower
- bearing residual
- cross-track error
- normalized residual
- possible outlier flag

Possible outliers remain visible instead of being silently discarded.

## Recheck / LOOK HERE

Items requiring another visual check can remain in the recheck queue.

Examples include suspected smoke, lightning areas, obscured sectors, prescribed burns, and active incidents.

**LOOK HERE** converts a geographic target into a bearing and range from the current lookout.

## Horizon

TOWER → HORIZON can load a local horizon image.

A manual bearing slider provides explicit calibration.

Choose:

**SMOKE HERE**

to begin a new smoke observation using the selected horizon bearing.

## Weather

Manual weather is available under:

**TOWER → WEATHER → MANUAL OBSERVATION**

Supported values include temperature, RH, wind direction, wind speed, gust, visibility, pressure, and cloud cover.

An optional JSON source may also be polled.

Default example:

```text
http://127.0.0.1:8780/weather
```

Example response:

```json
{
  "timestamp": "2026-08-13T04:00:00Z",
  "temperatureF": 82,
  "rh": 24,
  "windDir": "SW",
  "windMph": 11,
  "gustMph": 18,
  "pressureInHg": 29.91,
  "precipIn": 0,
  "visibilityMi": 28,
  "cloudCover": "FEW"
}
```

The weather source is optional. Manual and all core FIREWATCH functions continue to work offline.

## Landmark Import

Choose:

**MAP → IMPORT GEOJSON / CSV**

CSV format:

```text
name,lat,lon,type
Bear Creek,39.619,-78.603,WATER
Pine Mountain,39.691,-78.670,PEAK
West Ridge Repeater,39.667,-78.715,TOWER
```

GeoJSON Point features are also supported.

## Terrain Import

Choose:

**MAP → IMPORT TERRAIN CSV**

Format:

```text
lat,lon,elevationM
39.6427,-78.7560,885
39.6400,-78.7400,910
39.6350,-78.7200,945
```

Terrain samples enable approximate offline line-of-sight screening.

This is an operational screening tool, not a substitute for authoritative GIS terrain analysis.

## FWP/1

FIREWATCH contains a compact binary protocol intended for low-bandwidth links such as Meshtastic/LoRa.

The current packet size is exactly:

**27 bytes**

Supported message types include:

```text
OBS
UPDATE
BEARING
ACK
CLEAR
REQUEST
STATUS
```

FWP carries compact representations of report ID, timestamp, coordinates, bearing, range, event type, confidence, urgency, and flags.

The NETWORK screen can encode, decode, inspect, and simulate packets without a radio attached.

## Optional Meshtastic Bridge

The self-contained application does not require Meshtastic.

If a compatible local WebSocket bridge is available, FIREWATCH can connect to it.

Default URL:

```text
ws://127.0.0.1:8765
```

Incoming bridge messages may provide an FWP payload as hexadecimal bytes:

```json
{
  "payloadHex": "01 01 A7 2F 91 ..."
}
```

If the bridge is unavailable, FIREWATCH continues operating normally.

## Field Updates

Field-oriented updates include:

```text
ON SCENE
FIRE LOCATED
NO FIRE FOUND
CORRECT LOCATION
STATUS
```

A corrected location can become the incident location while preserving `FIELD CREW` as its provenance.

## Local Storage

FIREWATCH stores operational state in browser `localStorage`.

Storage key:

```text
firewatch.nobuild.v1.1
```

There is no telemetry or automatic cloud upload.

## Backup and Restore

Use:

**TOWER → EXPORT BACKUP**

to download the current FIREWATCH state as JSON.

Use:

**TOWER → IMPORT BACKUP**

to restore it.

Regular backups are recommended before changing browsers, computers, hostnames, or clearing site data.

## Fresh Start

**TOWER → FRESH START**

clears current operational records only after confirmation.

Export a backup first if the current data matters.

## Reports

FIREWATCH creates PDF reports directly in the browser.

No Internet service is required.

Incident PDFs can contain location, uncertainty, geometry, observation history, bearing evidence, and chronology.

Shift/handoff PDFs can contain weather, active incidents, open rechecks, handoff notes, and recent operational events.

## Keyboard Shortcuts

```text
N      New sighting
M      Map
L      Log
Esc    Close dialog
```

Shortcuts are ignored while typing in form fields.

## Offline Behavior

All application code, CSS, geometry, packet logic, demo data, and UI are embedded directly in the HTML file.

Normal FIREWATCH operation makes no runtime dependency requests.

Only explicitly configured optional services, such as a weather endpoint or Meshtastic bridge, require a network connection.

Because browser service workers must exist as separate same-origin resources, this true one-file edition does not register a PWA service worker.

## Privacy

FIREWATCH contains:

- no advertising
- no analytics
- no telemetry
- no tracking pixels
- no mandatory account
- no mandatory Internet connection
- no automatic cloud synchronization

Operational records remain in the current browser unless explicitly exported or transmitted.

## Safety Boundary

FIREWATCH is an observation, mapping, communications, and evidence-support instrument.

It does not replace agency dispatch procedures, incident command, trained wildfire personnel, official fire behavior models, validated GIS products, evacuation authority, radio procedures, or authoritative weather products.

## Known Limitations

The self-contained architecture makes deliberate tradeoffs.

The operational map is not a tiled topographic basemap. Terrain visibility uses imported point samples and is approximate. Horizon images are manually bearing-calibrated. Real Meshtastic connectivity requires an optional external bridge. Browser `localStorage` capacity varies, so very large horizon images can consume substantial storage.

These tradeoffs are intentional to preserve FIREWATCH's **no compile, no dependency, directly deployable** architecture.

## Troubleshooting

If FIREWATCH displays a startup error, copy the displayed diagnostic before clearing browser data.

If data appears missing after changing URLs, remember that browser storage is scoped to the page origin. Export from the old location and import into the new one.

If weather polling fails, check the URL, reachability, returned JSON, CORS, and HTTP/HTTPS mixed-content rules.

If the Meshtastic bridge fails, check the WebSocket URL, bridge process, firewall, browser mixed-content policy, and incoming `payloadHex` messages.

If the map has no topographic background, that is expected. Import landmarks and terrain data to provide local context without external mapping dependencies.

## Release Files

```text
FIREWATCH.html
index.html
README.md
README.txt
SHA256.txt
```

`FIREWATCH.html` and `index.html` are equivalent deployable copies.

---

**FIREWATCH v1.1.0**  
**No-Build / Self-Contained Edition**

**SEE IT. LOCATE IT. SHARE IT. KEEP WATCH.**