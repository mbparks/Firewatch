# FIREWATCH Sync Protocol 1.0

FIREWATCH synchronization is an **optional transport** for operational records. It does not replace the local IndexedDB database and it is independent from FWP/Meshtastic.

## Replicated entities

Only incident-centric operational data is synchronized:

- INCIDENT
- OBSERVATION
- BEARING
- WATCH_ITEM
- RADIO_LOG
- SHIFT_LOG
- FIELD_UPDATE
- PRESENCE (optional)

Large/local datasets such as terrain samples, panoramas, procedures, weather history, and generated reports are intentionally not replicated by the reference protocol.

## Push

`POST /sync/push`

```json
{
  "stationId": "BLACK-RIDGE",
  "stationRole": "LOOKOUT",
  "records": [
    {
      "entityType": "INCIDENT",
      "entityId": "inc-123",
      "updatedAt": "2026-08-13T03:00:00Z",
      "payload": {}
    }
  ]
}
```

The server stores an append-only version event and a latest-entity projection. Re-sending an identical entity/version is idempotent.

## Pull

`GET /sync/pull?stationId=BLACK-RIDGE&cursor=42`

Returns ordered events after the supplied server cursor plus `nextCursor`.

## Conflict policy

FIREWATCH does not silently merge equal-version divergent evidence. If local and remote records have the same update timestamp but different payloads, the browser stores a `SyncConflict` and exposes it in **NETWORK → CONFLICTS**.

The operator can explicitly:

- keep local evidence
- accept remote evidence

A clearly newer remote version is applied. A clearly older remote version does not replace newer local state.

## Availability model

The sync transport is opportunistic:

- no server: local operation continues
- no Starlink: Meshtastic and local workflows continue
- server returns: records are pushed/pulled on the next successful sync

## Security boundary

The included Python server is a reference LAN/private-network component. It does not provide agency identity, authorization, TLS termination, or multi-tenant isolation. Deploy behind appropriate authenticated network controls before exposing it to untrusted networks.
