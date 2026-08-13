# FIREWATCH Recovery & Backup

FIREWATCH v1.5.0 adds a second local recovery channel in addition to the primary autosaved state.

## Automatic recovery snapshots

Checksum-verified snapshots are retained locally. FIREWATCH creates or refreshes recovery evidence on events including:

- timed autosave intervals
- shift start/end
- page hide / visibility changes
- before START FRESH
- before NEW STATION
- before backup import
- after backup import
- field-test completion

The primary operational state remains in the existing FIREWATCH storage key so older v1.1–v1.4 data migrates forward.

## Recovery screen

Open **TOWER → DIAGNOSTICS** to:

- see local storage use
- inspect recovery timestamps/reasons
- verify recovery checksums
- create a manual snapshot
- restore a prior valid snapshot
- download diagnostic JSON

Before restoring a recovery snapshot, FIREWATCH first creates a recovery copy of the current state.

## JSON backup

**EXPORT BACKUP** remains the portable backup mechanism. Recovery snapshots are intentionally local browser protection; use JSON backups when moving FIREWATCH to another browser, computer, host, or origin.
