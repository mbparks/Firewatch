# FIREWATCH Lightning Watch

Batch 7 adds a local lightning-to-recheck workflow. This is an observation workload aid, not an ignition-probability model.

## Import CSV

From MAP choose **IMPORT LIGHTNING CSV**.

Required columns:

```csv
timestamp,lat,lon,status
2026-08-12T20:15:00Z,39.5200,-78.6300,UNCHECKED
```

Accepted coordinate headings include `lat` / `latitude` and `lon` / `lng` / `longitude`. Timestamp may be `timestamp`, `time`, `datetime`, or `date`.

## Clustering

Configure under **TOWER → MAP DATA → Lightning watch settings**:

- cluster radius in km
- cluster time window in hours
- default recheck delay
- automatic attention-score ordering or manual queue order

FIREWATCH groups nearby strikes within the configured time window. A cluster that still contains unchecked strike evidence can create a persistent recheck target at the cluster centroid.

## Recheck lifecycle

**CLEAR** marks the associated strikes `NO SMOKE` and closes the watch item.

**OBSCURED** keeps the watch open and moves the next due time forward.

**SMOKE** marks the cluster `POSSIBLE SMOKE` and opens a smoke sighting at the target bearing.

**FIRE** marks the cluster `CONFIRMED FIRE` and opens an emergency fire sighting at the target bearing.

## Attention score

The WATCH screen may order rechecks using a local attention score derived from configured priority, overdue state, incident linkage, lightning cluster size, and obscuration. It exists only to help an operator manage the visual-check queue. It is not a fire-danger, ignition-probability, response, or dispatch priority score.
