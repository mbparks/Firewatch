# Build Prompt: FIREWATCH — Distributed Wildfire Observation & Lookout Operations System

Build a complete browser-based web application called **FIREWATCH**.

**FIREWATCH — Distributed Wildfire Observation & Lookout Operations System**

FIREWATCH is a local-first, offline-capable operational web application for remote fire lookout towers, wildfire observers, dispatch personnel, field crews, and cooperating lookout stations.

It combines:

- wildfire and smoke observations
- map-based bearing plotting
- Osborne Fire Finder-style measurements
- multi-lookout triangulation
- horizon scanning
- panoramic landmark references
- terrain visibility analysis
- lightning follow-up
- weather observations
- incident tracking
- communications logging
- shift logging
- tower operations
- offline maps and data
- Meshtastic-based low-bandwidth fire reporting
- optional Internet synchronization

The application should support a complete operational workflow:

**PREPARE → SCAN → OBSERVE → LOCATE → ASSESS → SHARE → TRIANGULATE → REPORT → MONITOR → HAND OFF**

The central design principle is:

> **Help the lookout look outside more, not look at the computer more.**

FIREWATCH should feel like a field instrument, map table, fire finder, radio log, observation notebook, and distributed sensor network combined into one coherent application.

---

# 1. CORE PHILOSOPHY

FIREWATCH is designed for remote locations where connectivity may be:

- unavailable
- intermittent
- slow
- high latency
- limited to Starlink
- limited to cellular
- limited to Meshtastic/LoRa
- temporarily lost during an incident

The application must remain useful without Internet access.

Connectivity should enhance FIREWATCH, never define whether it works.

The application should be:

- local-first
- offline-first
- resilient
- fast
- map-centered
- evidence-oriented
- low-bandwidth
- operator-focused
- usable on laptops, tablets, and phones
- usable with mouse, touch, and keyboard
- installable as a PWA

Avoid building ordinary administrative software.

FIREWATCH should feel like an operational instrument.

---

# 2. TECHNICAL DIRECTION

This does **not** need to be a single-file application.

Use a clean modular architecture.

Preferred stack:

- React
- TypeScript
- Vite
- MapLibre GL JS
- IndexedDB
- Dexie or equivalent IndexedDB abstraction
- Service Worker
- PWA manifest
- Web Workers where useful
- modern CSS
- modular components
- optional lightweight local/server backend
- optional WebSocket radio bridge
- optional Meshtastic integration layer

Avoid unnecessary framework complexity.

The application should be easy to run locally.

Provide:

- `npm install`
- `npm run dev`
- `npm run build`
- clear README
- clean source structure

Suggested project structure:

```
src/
  app/
  components/
  map/
  observations/
  incidents/
  firefinder/
  triangulation/
  horizon/
  scans/
  lightning/
  weather/
  radio/
  mesh/
  reports/
  tower/
  storage/
  sync/
  protocol/
  workers/
  utils/

```

---

# 3. MAIN NAVIGATION

Keep navigation intentionally small.

Primary sections:

```
WATCH
MAP
INCIDENTS
LOG
TOWER

```

Secondary tools should appear contextually rather than becoming dozens of top-level menu items.

---

# 4. WATCH — PRIMARY OPERATING SCREEN

WATCH is the main screen during a shift.

It should provide a glanceable operational summary.

Display:

- tower name
- date/time
- shift/operator status
- fire danger
- temperature
- relative humidity
- wind direction
- wind speed
- gusts
- visibility
- precipitation
- current connectivity state
- active sightings
- confirmed incidents
- lightning watches
- overdue rechecks
- horizon scan freshness
- radio status
- Meshtastic status

Large actions:

```
NEW SIGHTING
START HORIZON SCAN
LOG RADIO
RECHECK

```

The screen should be readable from several feet away.

Favor:

- large text
- high contrast
- clear hierarchy
- few controls
- obvious alerts

---

# 5. NEW SIGHTING WORKFLOW

The most important workflow in FIREWATCH is recording smoke or fire.

The operator should be able to create the initial observation in seconds.

Press:

```
+ NEW SIGHTING

```

Immediately create a timestamped draft observation.

Minimum quick-entry fields:

- bearing / azimuth
- observation type
- confidence

Optional fields:

- estimated range
- vertical angle
- smoke color
- smoke density
- smoke shape
- smoke motion
- growth
- flames visible
- intermittent or continuous
- obscured
- number of plumes
- notes
- photo
- approximate target location
- nearby landmark

Do not require every field before saving.

Use:

**CAPTURE NOW → REFINE LATER**

as the workflow philosophy.

---

# 6. OBSERVATION TYPES

Support at least:

```
UNKNOWN
SMOKE
FIRE
FLAME
LIGHTNING
PRESCRIBED BURN
STRUCTURE FIRE
FALSE ALARM
CLEAR
OTHER

```

Confidence levels:

```
UNKNOWN
LOW
MODERATE
HIGH
CONFIRMED

```

Urgency:

```
ROUTINE
IMPORTANT
EMERGENCY

```

---

# 7. MAP WORKSPACE

MAP should be the central geographic workspace.

Show:

- lookout tower
- cooperating towers
- observations
- bearing rays
- triangulation intersections
- estimated incident origins
- uncertainty areas
- roads
- trails
- streams
- lakes
- water sources
- ridgelines
- peaks
- settlements
- administrative boundaries
- weather stations
- repeaters
- recent lightning
- prescribed burns
- active incidents
- visible/hidden terrain
- cached map boundaries

Allow map layers to be toggled.

Include:

- pan
- zoom
- fit to incident
- measure distance
- measure bearing
- coordinate readout
- click location inspector
- offline cache status

---

# 8. FIRE FINDER MODE

Provide a dedicated Fire Finder interface inspired by an Osborne Fire Finder.

Inputs:

```
AZIMUTH
VERTICAL ANGLE
OPTIONAL RANGE

```

Use large numeric controls.

Example:

```
AZIMUTH
247.3°

VERTICAL ANGLE
-0.7°

[PLOT]

```

The application should draw the observation ray from the tower.

If elevation/terrain data is available, estimate likely terrain intersections.

Never imply false precision.

Show ranges such as:

```
PROBABLE ORIGIN

Bearing      247.3°
Range        8.4–10.1 mi
Elevation    4,100–4,700 ft
Confidence   MODERATE

```

Where uncertainty exists, visualize an uncertainty corridor or region.

---

# 9. PRESERVE RAW AND DERIVED DATA

Never overwrite the original observation with a calculated position.

Store both.

Example:

```
RAW OBSERVATION

Tower:
Black Ridge

Bearing:
247.3°

Range estimate:
9.2 mi

```

and:

```
DERIVED LOCATION

Latitude:
39.623817

Longitude:
-78.492105

Method:
bearing-range projection

```

Maintain provenance for every derived result.

---

# 10. MULTI-TOWER TRIANGULATION

Allow observations from multiple lookout towers to reference the same incident.

Example:

```
Tower A     247.3°
Tower B     121.7°
Tower C      19.2°

```

Calculate an estimated fire location.

For two bearings:

- intersect bearing lines
- calculate location
- show geometry
- estimate uncertainty

For three or more:

- perform best-fit / least-squares intersection
- calculate geometry quality
- identify inconsistent bearings
- estimate uncertainty radius or ellipse

Display:

```
ESTIMATED LOCATION

39.62379
-78.49217

OBSERVATIONS
3

UNCERTAINTY
±310 m

GEOMETRY QUALITY
GOOD

```

Do not silently discard outliers.

Show them.

---

# 11. LOOK HERE

Create a core feature called:

```
LOOK HERE

```

Any geographic watch item can produce a direction from the tower.

Examples:

- another tower's smoke report
- lightning strike
- incident
- recheck target
- known burn
- reported coordinate

When activated, display:

```
BEARING 143°

Bear Creek
11.3 miles

```

Then give large actions:

```
CLEAR
OBSCURED
SMOKE
FIRE

```

This should be usable quickly while physically looking through binoculars.

---

# 12. HORIZON PANORAMA

Support a calibrated 360° panorama from the tower.

Allow the user to:

- upload horizon photographs
- stitch or organize panoramic images
- assign bearings
- annotate landmarks
- mark peaks
- mark roads
- mark towers
- mark valleys
- mark burn scars
- mark settlements

As the operator moves around the panorama, show:

```
267° W

BLACK RIDGE
14.3 mi

BEAR CREEK
10.8 mi

FOREST ROAD 12
8.7 mi

```

Include:

```
SMOKE HERE

```

which automatically starts a new sighting with the panorama bearing.

---

# 13. HORIZON SCAN

Divide the tower's horizon into configurable sectors.

Example:

```
000–030°
030–060°
060–090°
...

```

Support:

```
START FULL SCAN

```

Guide the operator systematically through sectors.

Each sector should track:

- last scan timestamp
- visibility
- haze
- cloud cover
- smoke
- obstruction
- notes

Display sector freshness visually.

Example:

```
000–030  ✓  14:10
030–060  ✓  14:12
060–090  ✓  14:15
090–120  ⚠  13:41

```

Older sectors should gradually become visually overdue.

Avoid gamification.

This is operational coverage, not a score.

---

# 14. VIEWSHED / TERRAIN VISIBILITY

Support optional terrain-based visibility analysis.

Given tower elevation and terrain data, calculate:

- line of sight
- visible terrain
- terrain masked behind ridges
- obstruction distance
- horizon angle

Click a point and display:

```
VISIBLE FROM TOWER?

YES

Distance:
17.4 mi

Bearing:
312°

Vertical angle:
-1.8°

```

or:

```
VISIBLE FROM TOWER?

NO

Obstructed by:
Eagle Ridge

Obstruction distance:
9.3 mi

```

Clearly label calculated visibility as modeled, not guaranteed real-world visibility.

---

# 15. LIGHTNING WATCH

When connectivity exists, support importing recent lightning strike information.

The application must also allow manual lightning entries.

Each strike or cluster can become a watch item.

Example:

```
LIGHTNING WATCH

Bear Creek
17 strikes
Yesterday 16:32–16:47
11.8 mi
Bearing 122°

STATUS
Needs visual check

```

Statuses:

```
UNCHECKED
CHECKED
OBSCURED
NO SMOKE
POSSIBLE SMOKE
CONFIRMED FIRE
CLOSED

```

Lightning events should persist after the storm.

---

# 16. RECHECK QUEUE

Create a unified RECHECK system.

Any item requiring another observation can enter the queue.

Examples:

```
HIGH
247° suspected smoke
Last checked 12 min ago

HIGH
Bear Creek lightning cluster
Not checked today

MEDIUM
North sector obscured by haze

LOW
Prescribed burn
Confirm extinguished

```

Support:

- due time
- priority
- reason
- target bearing
- target location
- associated incident
- recheck result

---

# 17. WEATHER DESK

Support both remote and local weather data.

Possible sources:

- Internet APIs
- manual observation
- local weather sensors
- imported station data

Track:

- temperature
- RH
- wind direction
- wind speed
- gusts
- pressure
- precipitation
- visibility
- cloud cover
- notes

Always label provenance.

Examples:

```
SOURCE
Tower sensor

```

```
SOURCE
Manual observation

```

```
SOURCE
Remote weather station

```

```
SOURCE
Forecast

```

Never silently merge observed and forecast conditions.

---

# 18. VISIBILITY ESTIMATION

Allow known landmarks to be used as visibility references.

Example:

```
Bear Ridge       8 mi    VISIBLE
Pine Mountain   17 mi    VISIBLE
Radio Tower     31 mi    VISIBLE
Eagle Peak      46 mi    NOT VISIBLE

```

Estimate:

```
CURRENT VISIBILITY
~31 miles

```

Store the observation in the shift log.

---

# 19. INCIDENT MANAGEMENT

A sighting can mature into an incident.

Lifecycle:

```
SIGHTING
→ SUSPECTED
→ REPORTED
→ CONFIRMED
→ RESPONDING
→ MONITORING
→ CLOSED

```

Each incident should contain:

## Location

- lat/lon
- uncertainty
- bearing
- range
- elevation
- location method

## Observations

All associated lookout reports.

## Bearings

All bearing measurements from all towers.

## Photos

Images and timestamps.

## Communications

Radio and dispatch records.

## Weather

Conditions during observation.

## Mesh Traffic

Associated FIREWATCH Protocol messages.

## Timeline

Chronological event history.

Example:

```
14:32 smoke first observed
14:34 bearing measured
14:36 dispatch notified
14:41 second tower bearing received
14:42 triangulated location generated
14:51 smoke column increasing
15:04 engine assigned

```

---

# 20. RADIO LOG

Provide a large:

```
LOG RADIO

```

button.

Tapping it immediately timestamps the entry.

Fields:

- to/from
- station or callsign
- type
- notes
- associated incident
- channel if useful

Types:

```
REPORT
ACKNOWLEDGMENT
REQUEST
STATUS
DISPATCH
FIELD UPDATE
OTHER

```

Fast entry is more important than detailed formatting.

---

# 21. AUTOMATIC SHIFT LOG

Nearly every operational action should automatically generate a shift log entry.

Examples:

```
06:02 SHIFT START
06:11 Radio check complete
06:17 Weather observation entered
07:03 Full horizon scan complete
08:16 Lightning sector checked
10:42 Visibility decreased to 18 mi
12:08 Smoke observed bearing 247°
12:11 Dispatch notified
12:16 Observation upgraded

```

Allow manual log entries too.

The operator should not have to maintain several independent logs.

---

# 22. SHIFT HANDOFF

Provide:

```
GENERATE HANDOFF

```

Summarize:

- active incidents
- unresolved sightings
- recheck items
- lightning watches
- equipment issues
- degraded communications
- key weather changes
- important notes

Example:

```
ACTIVE INCIDENTS        1
OPEN SIGHTINGS          0
RECHECK ITEMS           3
LIGHTNING WATCHES       5
EQUIPMENT ISSUES        1

PRIORITY HANDOFF

1. Continue monitoring Pine Creek fire.
2. Check Bear Creek lightning sector after sunrise.
3. Radio repeater #2 intermittent.

```

Support printable and PDF output.

---

# 23. TOWER OPERATIONS

Create a TOWER area for local operational information.

Sections:

```
SHIFT
RADIO
EQUIPMENT
FACILITY
EMERGENCY
CONTACTS
MAP DATA
NETWORK

```

Support procedures such as:

- opening checklist
- closing checklist
- radio procedures
- fire finder procedures
- weather observation procedures
- lightning procedures
- evacuation procedures
- generator operation
- solar/battery notes
- emergency contacts

Everything important should remain available offline.

---

# 24. EQUIPMENT REGISTER

Track tower equipment.

Example:

```
Fire Finder         OK
Binoculars          OK
Weather Station     WATCH
Radio A             OK
Radio B             FAULT
Solar System        OK
Starlink            DEGRADED
Generator           OK
Meshtastic Node     OK

```

Statuses:

```
OK
WATCH
FAULT
OUT OF SERVICE
UNKNOWN

```

Equipment changes should enter the shift log.

---

# 25. CONNECTIVITY DASHBOARD

Connectivity status must be explicit.

Example:

```
NETWORK

LOCAL DATABASE    READY
PWA CACHE         READY
MESHTASTIC        CONNECTED
STARLINK          DEGRADED
SERVER SYNC       17 MIN AGO
MAP CACHE         READY
WEATHER CACHE     42 MIN OLD

```

Never use indefinite loading indicators when data is simply unavailable.

Clearly distinguish:

```
LIVE
CACHED
STALE
UNAVAILABLE

```

---

# 26. MESHTASTIC INTEGRATION

Meshtastic should be a first-class FIREWATCH transport.

The purpose is to share highly compact wildfire observations between:

- lookout towers
- dispatch
- ranger stations
- field crews
- mobile observers
- relay nodes

The mesh must remain useful without Internet connectivity.

Do not rely on free-form chat for operational reports.

Implement a structured low-bandwidth FIREWATCH protocol.

---

# 27. FIREWATCH PROTOCOL — FWP

Define:

```
FWP/1
FIREWATCH PROTOCOL VERSION 1

```

FWP should be:

- transport agnostic
- binary-friendly
- versioned
- compact
- event-oriented
- idempotent
- store-and-forward capable
- resilient to duplicate delivery
- suitable for LoRa
- generally under 50 bytes per normal observation packet

Meshtastic is one transport for FWP.

Future transports may include:

```
FWP / Meshtastic
FWP / HTTP
FWP / WebSocket
FWP / MQTT
FWP / Serial
FWP / Satellite

```

Do not tightly couple incident data to Meshtastic internals.

---

# 28. FWP MESSAGE TYPES

Support at least:

```
OBS
UPDATE
BEARING
ACK
CLEAR
REQUEST
STATUS

```

Possible future types:

```
ON_SCENE
CORRECTION
WEATHER
RELAY
SYNC_REQUEST
SYNC_RESPONSE

```

---

# 29. FWP OBSERVATION PACKET

Design a compact binary representation conceptually containing:

```
VERSION
MESSAGE TYPE
REPORT ID
REVISION
TIMESTAMP
TARGET LATITUDE
TARGET LONGITUDE
BEARING
RANGE
EVENT TYPE
CONFIDENCE
URGENCY
FLAGS

```

Do not transmit JSON unless used for debugging.

Provide a human-readable packet inspector in the application.

Example decoded packet:

```
FWP OBSERVATION

Report ID:     A72F91
Revision:      3
Time:          14:32:17

Type:          SMOKE
Urgency:       IMPORTANT
Confidence:    HIGH

Target:
39.623817
-78.492105

Bearing:
247.3°

Range:
14.8 km

Flags:
SMOKE
COLUMN
GROWING

```

---

# 30. COMPACT NUMERIC ENCODING

Avoid floating-point values on the wire.

Suggested encoding:

## Latitude / Longitude

Integer scaled by `1e7`.

Example:

```
39.6238170
→
396238170

```

## Bearing

Store tenths of a degree.

Example:

```
247.3°
→
2473

```

## Range

Store integer meters or 10-meter units.

Choose a documented representation and remain consistent.

---

# 31. FWP FLAGS

Define a bitfield for compact observation flags.

Initial flags:

```
BIT 0   SMOKE VISIBLE
BIT 1   FLAME VISIBLE
BIT 2   GROWING
BIT 3   COLUMN
BIT 4   DRIFTING
BIT 5   INTERMITTENT
BIT 6   OBSCURED
BIT 7   MULTIPLE PLUMES

BIT 8   LIGHTNING ASSOCIATED
BIT 9   STRUCTURE THREAT
BIT 10  ROAD THREAT
BIT 11  PRESCRIBED BURN POSSIBLE
BIT 12  HUMAN ACTIVITY SEEN
BIT 13  AIRCRAFT OBSERVED
BIT 14  LOCATION TRIANGULATED
BIT 15  URGENT

```

Display these with readable labels in the UI.

---

# 32. REPORT IDS

Every observation/report needs a compact unique ID.

Example:

```
A72F91

```

Use a collision-resistant scheme derived from:

- node identity
- sequence number
- optional random component

Every update references the same report ID.

Example:

```
OBS      A72F91
UPDATE   A72F91
BEARING  A72F91
ACK      A72F91
CLEAR    A72F91

```

Track revisions.

---

# 33. MESHTASTIC OBSERVATION SHARING

Example workflow:

Tower A sees smoke.

FIREWATCH sends:

```
OBS A72F91
SMOKE
247.3°
HIGH

```

Tower B receives:

```
NEW SMOKE REPORT

Black Ridge Tower
Bearing 247.3°

[LOOK HERE]

```

Tower B looks toward the expected region.

If the same smoke is visible, Tower B records:

```
BEARING
121.7°

```

and sends:

```
BEARING A72F91
121.7°

```

FIREWATCH automatically triangulates the two observations.

---

# 34. DISTRIBUTED TRIANGULATION OVER MESH

When multiple bearings referencing the same report arrive:

```
Tower A     247.3°
Tower B     121.7°
Tower C      19.2°

```

Automatically update the incident.

Display:

```
TRIANGULATED

Estimated location:
39.62379
-78.49217

Uncertainty:
±310 m

Contributing towers:
3

```

Allow the operator to inspect exactly which measurements produced the result.

---

# 35. HUMAN ACKNOWLEDGMENT

Distinguish network delivery acknowledgment from operational acknowledgment.

Display separately:

```
TRANSPORT

✓ Packet transmitted
✓ Mesh delivery acknowledged

```

and:

```
OPERATIONS

✓ Dispatch acknowledged
14:34:51

```

A network acknowledgment must never be presented as evidence that a human operator has seen the report.

---

# 36. FWP REQUEST MESSAGE

Allow one station to request help from another.

Example:

```
REQUEST

REPORT:
A72F91

REQUEST TYPE:
BEARING

TARGET:
Pine Ridge Tower

```

Receiving FIREWATCH stations should provide:

```
[LOOK HERE]

```

and then:

```
[NO VISUAL]
[OBSCURED]
[SMOKE SEEN]
[SEND BEARING]

```

---

# 37. MESHTASTIC TRAFFIC POLICY

FIREWATCH must be conservative with airtime.

Do not continuously transmit:

- weather
- GPS
- scan progress
- status
- map position
- repetitive observations

Use event-driven traffic.

Transmit when meaningful state changes.

Examples:

```
NEW OBSERVATION
NEW BEARING
CONFIDENCE CHANGE
FIRE GROWING
LOCATION CORRECTION
DISPATCH ACK
INCIDENT CLOSED

```

Quiet towers should produce almost no mesh traffic.

---

# 38. OPTIONAL STATUS HEARTBEAT

Provide an optional configurable heartbeat.

Default should be conservative.

Example:

```
TOWER STATUS

NODE:
BLACKRIDGE

ON DUTY:
YES

BATTERY:
82%

ACTIVE INCIDENTS:
1

```

Suggested intervals:

- disabled
- 15 min
- 30 min
- 60 min

Do not force frequent status messages.

---

# 39. LOCAL FIREWATCH RADIO BRIDGE

Do not make browser serial APIs the only integration path.

Design an optional local radio bridge.

Architecture:

```
FIREWATCH PWA
      │
      │ WebSocket / localhost API
      ▼
FIREWATCH RADIO BRIDGE
      │
      │ Meshtastic SDK
      ▼
MESHTASTIC RADIO

```

The bridge may be implemented separately using a robust host-side language/runtime.

Responsibilities:

- connect to Meshtastic radio
- encode FWP
- decode FWP
- queue outbound messages
- receive inbound messages
- expose connection health
- handle reconnection
- persist pending messages
- prevent duplicates
- provide event stream to the browser

The FIREWATCH application should still run without the radio bridge.

---

# 40. OPTIONAL DIRECT BROWSER RADIO MODE

Also leave room for experimental direct browser connectivity using:

- Web Serial
- Web Bluetooth
- supported browser transports

But do not require it.

Clearly label:

```
DIRECT RADIO MODE
Experimental

```

---

# 41. STORE AND FORWARD

Maintain a local append-only event ledger.

Example:

```
00382 OBS A72F91
00383 UPDATE A72F91
00384 BEARING A72F91
00385 ACK A72F91
00386 OBS B19C22

```

When Internet access returns:

```
SYNC 37 EVENTS

```

Do not require the cloud server to reconstruct basic local operation.

---

# 42. DUPLICATE HANDLING

Mesh networks can produce duplicate deliveries.

FWP handling must be idempotent.

Deduplicate using:

- report ID
- revision
- message type
- origin node
- sequence/message identifier

Receiving the same packet twice must not create two observations.

---

# 43. OFFLINE DATA

Use IndexedDB for operational storage.

Store locally:

- towers
- landmarks
- observations
- incidents
- bearings
- radio entries
- lightning events
- recheck items
- weather observations
- scan records
- equipment
- logs
- mesh messages
- map metadata
- app settings

The application should automatically persist changes.

---

# 44. AUTOSAVE

Provide a visible autosave indicator.

States:

```
UNSAVED
SAVING
SAVED
ERROR

```

Avoid modal "Save" workflows for routine use.

---

# 45. PROJECT / STATION BACKUP

Support:

```
EXPORT FIREWATCH BACKUP
IMPORT FIREWATCH BACKUP

```

Use a documented JSON format for user backup/export.

This format is separate from compact FWP radio packets.

Support exporting:

- station configuration
- landmarks
- incidents
- shift logs
- observations
- mesh history
- equipment records

---

# 46. MAP OFFLINE CACHE

Provide an offline map manager.

Allow users to define an operating region and download/cache permitted map data.

Display:

```
OFFLINE MAP REGION

Allegheny District
742 MB
Last updated Aug 9

STATUS
READY

```

Do not assume an Internet map source is always reachable.

---

# 47. MAP DATA IMPORT

Allow operators to import useful local datasets where technically practical:

- GeoJSON
- GPX
- KML
- CSV coordinates

Possible layers:

- lookout towers
- roads
- trails
- water
- boundaries
- repeaters
- known landmarks
- evacuation routes
- prescribed burns

---

# 48. REPORTING

Support reports for:

## Incident Report

- location
- map
- uncertainty
- observations
- bearing geometry
- timeline
- weather
- communications
- mesh messages
- photos

## Shift Report

- weather
- scans
- observations
- incidents
- radio log
- equipment problems

## Handoff Report

- unresolved items
- priorities
- watches

Support:

```
PRINT
EXPORT PDF
EXPORT JSON

```

---

# 49. OPERATOR MODE VS ANALYSIS MODE

Use two main interaction modes:

```
OPERATE
ANALYZE

```

## OPERATE

Optimized for active lookout work.

Show:

- large buttons
- rapid entry
- active watches
- map
- bearings
- radio
- rechecks

## ANALYZE

Show deeper engineering/GIS information:

- triangulation geometry
- uncertainty calculations
- terrain intersection
- detailed protocol packets
- map layers
- historical observations
- raw vs derived data
- sync history

Do not make these modes entirely separate applications.

They should expose different levels of detail on the same data.

---

# 50. MOBILE FIELD MODE

Support mobile crews receiving FIREWATCH reports.

A field crew could carry:

```
Phone
+
Meshtastic radio

```

Display received incidents as:

```
FIRE A72F91

39.6238, -78.4921

2.7 mi NW

CONFIRMED
GROWING

[MAP]

```

Actions:

```
ON SCENE
FIRE LOCATED
NO FIRE FOUND
CORRECT LOCATION
SEND UPDATE

```

These should update the same incident model.

---

# 51. DATA MODEL

Create clean typed models for at least:

```
Tower
Operator
Shift
Landmark
Sector
Observation
Bearing
Incident
Photo
LightningEvent
WatchItem
WeatherObservation
RadioLog
Equipment
MapLayer
MeshNode
FWPMessage
SyncEvent
Handoff

```

Relationships should be explicit.

Example:

```
Incident
 ├── Observations
 ├── Bearings
 ├── Photos
 ├── RadioLogs
 ├── WeatherObservations
 ├── FWP Messages
 └── Watch Items

```

---

# 52. EVENT LEDGER

Internally favor event-oriented history.

Important state transitions should never erase prior evidence.

Example:

```
14:32 OBSERVATION_CREATED
14:34 BEARING_REFINED
14:36 DISPATCH_NOTIFIED
14:41 REMOTE_BEARING_RECEIVED
14:42 LOCATION_TRIANGULATED
14:51 OBSERVATION_UPDATED
15:04 RESPONSE_ASSIGNED

```

Allow users to inspect incident history.

---

# 53. PROVENANCE

For important information, track how it was obtained.

Example:

```
LOCATION SOURCE

Triangulation
Tower A + Tower B
Calculated 14:42:17

```

Other source types:

```
MANUAL
GPS
BEARING/RANGE
TRIANGULATION
REMOTE REPORT
FIELD CREW
MAP SELECTION
IMPORTED

```

---

# 54. UNCERTAINTY

Never imply measurements are exact when they are not.

Where useful, track:

- bearing uncertainty
- range uncertainty
- location uncertainty
- geometry quality
- confidence

Map uncertainty visually.

Prefer:

```
±420 m

```

or:

```
PROBABLE AREA

```

over an unexplained precise pin.

---

# 55. SAFETY / DECISION SUPPORT BOUNDARY

FIREWATCH is an observation, communications, mapping, and coordination instrument.

It should not claim to replace:

- dispatch procedures
- incident command
- trained wildfire personnel
- agency radio procedures
- official fire behavior models
- evacuation decisions
- validated operational systems

Show an appropriate disclaimer in About / Help.

Do not clutter normal operations with repeated warning banners.

---

# 56. UI / UX DIRECTION

Visual design:

- dark instrument-panel aesthetic optional
- excellent daylight mode required
- high contrast
- large typography
- restrained color
- clear status indicators
- touch-friendly targets
- minimal visual clutter

Avoid:

- generic SaaS dashboards
- excessive cards
- gradients everywhere
- tiny controls
- decorative charts
- gamification
- hidden critical state

The map and operational state should dominate.

---

# 57. STATUS COLORS

Do not rely on color alone.

Use text + icon + color.

Examples:

```
OK
WATCH
IMPORTANT
EMERGENCY
OFFLINE
STALE

```

Ensure color-blind accessibility.

---

# 58. KEYBOARD SHORTCUTS

Provide useful shortcuts where appropriate.

Example:

```
N   New sighting
S   Start scan
R   Log radio
M   Map
L   Shift log
Esc Close dialog

```

Display shortcuts in tooltips and Help.

---

# 59. SAMPLE DATA

Provide a realistic optional demo dataset.

Example station:

```
Black Ridge Lookout

```

Include:

- neighboring lookout towers
- landmarks
- one possible smoke observation
- one confirmed fire
- lightning cluster
- several radio entries
- weather observations
- a triangulation example
- a few FWP messages

But new installations should allow a genuinely empty state.

Provide:

```
LOAD DEMO
CLEAR DEMO / FRESH START

```

Do not permanently mix sample data with real operator data.

---

# 60. VERSIONING

Display the application version visibly.

Example:

```
FIREWATCH v0.1.0

```

Use semantic versioning.

Include version in exported backups and reports.

---

# 61. INITIAL RELEASE

Implement a polished working **v0.1** rather than placeholders for everything.

v0.1 should include:

## WATCH

- shift overview
- current conditions
- active observations
- recheck queue
- scan freshness

## MAP

- tower
- landmarks
- observations
- bearing plotting
- incident locations

## OBSERVATIONS

- create/edit observation
- confidence
- event type
- smoke attributes
- photos/notes structure

## FIRE FINDER

- bearing
- vertical angle
- optional range
- map ray

## INCIDENTS

- convert sighting to incident
- timeline
- status
- location
- observations

## TRIANGULATION

- at least two-tower bearing intersection

## LOG

- shift log
- manual log
- radio log

## MESHTASTIC / FWP

- FWP data model
- packet encoder
- packet decoder
- packet inspector
- simulated mesh transport
- send/receive event workflow
- report IDs
- duplicate handling

## OFFLINE

- IndexedDB
- service worker
- PWA
- autosave
- local persistence
- JSON export/import

---

# 62. SIMULATED MESH MODE

Because development may happen without radios attached, build a full simulator.

Provide:

```
MESH SIMULATOR

```

Allow simulated nodes:

```
Black Ridge
Pine Ridge
Dispatch
Engine 17

```

Actions:

- send observation
- send bearing
- delay packet
- duplicate packet
- drop packet
- disconnect node
- reconnect node
- send acknowledgment

Use this to test distributed incident workflows.

---

# 63. PACKET INSPECTOR

Provide an analysis tool showing:

```
FWP MESSAGE

Type:
BEARING

Report:
A72F91

Origin:
PINE-RIDGE

Revision:
3

Payload:
23 bytes

Decoded:
Bearing 121.7°

Transport:
Meshtastic

```

Optionally display raw bytes in hex.

Useful for protocol development and diagnostics.

---

# 64. DEVELOPMENT ROADMAP

Structure future releases roughly as:

```
v0.1
Operational skeleton + map + observations + FWP simulation

v0.2
Fire Finder + improved triangulation

v0.3
Real Meshtastic bridge integration

v0.4
Horizon panorama + landmark calibration

v0.5
Lightning watch + recheck engine

v0.6
Terrain/viewshed analysis

v0.7
Weather integrations + local sensors

v0.8
Reports + shift handoff + tower operations

v0.9
Multi-station synchronization + field crew mode

v1.0
Complete distributed lookout operations platform

```

---

# 65. README

Include a comprehensive README covering:

- what FIREWATCH is
- intended use
- architecture
- installation
- development
- production build
- offline behavior
- local database
- map caching
- Meshtastic integration architecture
- FWP protocol overview
- simulated mesh mode
- radio bridge concept
- backup/import/export
- privacy
- limitations
- roadmap

---

# 66. PRIVACY

FIREWATCH should contain:

- no analytics
- no advertising
- no telemetry
- no unnecessary third-party tracking
- no mandatory cloud account

Operational information belongs to the operator/organization.

Any remote synchronization must be explicit.

---

# 67. FIRST-RUN EXPERIENCE

On first launch:

```
WELCOME TO FIREWATCH

[CREATE TOWER]
[IMPORT STATION]
[LOAD DEMO]

```

Creating a tower asks for:

- tower name
- latitude
- longitude
- elevation
- timezone
- optional callsign
- optional Meshtastic node ID

Then enter the WATCH workspace.

Do not make onboarding unnecessarily long.

---

# 68. SUCCESS CRITERIA

A successful FIREWATCH build should make these scenarios straightforward:

### Scenario A — Local Smoke

A lookout spots smoke, enters bearing 247.3°, records it in under 15 seconds, and sees the bearing on the map.

### Scenario B — Second Tower

Another lookout receives the report over the simulated or real Meshtastic mesh, clicks LOOK HERE, enters its own bearing, and both stations receive the triangulated estimate.

### Scenario C — Internet Failure

Starlink disappears. FIREWATCH continues:

- logging
- mapping cached data
- creating observations
- communicating over the mesh
- recording incidents

### Scenario D — Reconnection

Internet returns. Pending events synchronize without data loss or duplication.

### Scenario E — Shift Handoff

A new operator can immediately see:

- what is active
- what requires another look
- what happened during the previous shift
- which systems are degraded

### Scenario F — Incident Evidence

An incident page clearly shows:

**WHAT WAS SEEN → FROM WHERE → BY WHOM → WHEN → HOW LOCATION WAS DERIVED → WHAT WAS COMMUNICATED → WHAT HAPPENED NEXT**

---

# 69. FINAL PRODUCT CHARACTER

FIREWATCH should ultimately feel like:

**an Osborne Fire Finder, topographic map, observation notebook, Meshtastic terminal, incident board, weather desk, and tower logbook transformed into one coherent digital field instrument.**

It should not feel like a generic GIS dashboard.

It should not feel like dispatch CAD software.

It should not feel like a chat client with a map.

Its identity should be unmistakable:

# FIREWATCH

**SEE IT. LOCATE IT. SHARE IT. KEEP WATCH.**