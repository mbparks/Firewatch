# FIREWATCH Two-Lookout Field Test

Open **TOWER → FIELDTEST** and start a run. Record PASS/FAIL and evidence for each step.

The v1.5.0 acceptance sequence is:

1. Confirm station coordinates and neighboring lookout node IDs.
2. Connect both Meshtastic radios / verify nodes visible.
3. Tower A records and sends OBS.
4. Tower B receives OBS and a local incident appears.
5. Tower A sends REQUEST BEARING.
6. Tower B receives an actionable LOOK HERE request.
7. Tower B measures and sends a BEARING response.
8. Tower A receives the bearing and triangulation updates.
9. Radio / transport ACK is recorded.
10. Human / operations ACK is recorded separately.
11. Disconnect the radio bridge intentionally.
12. Create an outbound message while offline and verify QUEUED state.
13. Reconnect the bridge and verify queued-message flush/retry.
14. Generate handoff/backup and record the overall result.

## Suggested bench setup

- two computers/tablets or two browser profiles
- two Meshtastic nodes
- one FIREWATCH station configured as Tower A
- one FIREWATCH station configured as Tower B
- the Python Meshtastic bridge on each station if using serial/TCP radios

The test runner is an evidence checklist, not an automated RF certification tool. Export each run as JSON and retain failed-run notes before fixing the application or radio configuration.
