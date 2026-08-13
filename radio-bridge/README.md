# FIREWATCH Radio Bridge v0.3.0

The radio bridge is a local process that connects the FIREWATCH browser app to a Meshtastic radio without making browser serial APIs the critical path.

```text
FIREWATCH PWA
    │ ws://127.0.0.1:8765
    ▼
FIREWATCH Radio Bridge
    │ Meshtastic Python API
    ▼
USB serial or Meshtastic TCP node
```

It only transports FWP bytes. Incidents, observations, bearings, triangulation, and human acknowledgments remain in the browser application.

## Install

Python 3.10+ is recommended.

```bash
cd radio-bridge
python -m venv .venv
```

Linux/macOS:

```bash
source .venv/bin/activate
pip install -r requirements.txt
python bridge.py
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python bridge.py
```

The requirements are pinned to the versions used for this Batch 1 implementation:

- `meshtastic==2.7.11`
- `websockets==17.0.1`

## Serial radio

Auto-detect a connected Meshtastic radio:

```bash
python bridge.py
```

Specify a device explicitly:

```bash
python bridge.py --device /dev/ttyACM0
python bridge.py --device COM5
```

## TCP radio

```bash
python bridge.py --tcp-host 192.168.1.42
```

## FIREWATCH configuration

Open **TOWER → MESHTASTIC BRIDGE** and set:

- Transport mode: `Local radio bridge`
- Bridge WebSocket: `ws://127.0.0.1:8765`
- FWP private port: `256`

Then open **MAP → MESH**.

The UI will show the bridge state, connected local node, discovered nodes, and FWP traffic.

## What the bridge implements

- Meshtastic serial auto-detection or explicit serial device
- Meshtastic TCP interface
- private `PortNum` 256 by default
- raw binary FWP payload send/receive
- node directory forwarding to the browser
- WebSocket state/event stream
- direct or broadcast sends
- directed Meshtastic ACK/NAK correlation
- persistent outbound queue if the radio is offline
- automatic queue flush after radio reconnection
- RX metadata: packet ID, SNR, RSSI, hop limit, channel

Broadcast FWP traffic is intentionally not sent with Meshtastic `wantAck`; directed packets may request reliable delivery. A Meshtastic delivery acknowledgment remains distinct from FIREWATCH's human/operational ACK.

## Command options

```text
--device DEVICE       serial device (omit for auto-detect)
--tcp-host HOST       use Meshtastic TCPInterface
--host HOST           WebSocket bind host; default 127.0.0.1
--ws-port PORT        WebSocket port; default 8765
--port 256..511       FIREWATCH Meshtastic private PortNum; default 256
--channel INDEX       Meshtastic channel index; default 0
--queue-file PATH     persistent outbound queue
--debug               verbose logging
```

## Security model

The bridge binds to `127.0.0.1` by default. Keep it local unless you deliberately secure and expose it. FIREWATCH does not require a cloud account or Internet connection for bridge operation.

## Hardware-test note

The bridge code is implemented and Python-syntax validated in the build environment, but this release was not exercised against a physical Meshtastic radio in the artifact sandbox. Validate the chosen channel, firmware, serial permissions, and radio policy before field deployment.
