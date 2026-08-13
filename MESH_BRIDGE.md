# FIREWATCH Meshtastic Bridge

The browser app remains no-build. `meshtastic_bridge.py` is an optional localhost adapter to the Meshtastic Python host API.

```text
FIREWATCH HTML ↔ WebSocket 127.0.0.1:8765 ↔ Python bridge ↔ Meshtastic Serial/TCP ↔ LoRa
```

## Install and run

```bash
python -m pip install -r requirements-meshtastic-bridge.txt
python meshtastic_bridge.py
```

Specific serial device:

```bash
python meshtastic_bridge.py --serial COM5
python meshtastic_bridge.py --serial /dev/ttyUSB0
```

TCP node:

```bash
python meshtastic_bridge.py --tcp 192.168.1.50
```

Alternative private port:

```bash
python meshtastic_bridge.py --port-num 300
```

Use the same PortNum in FIREWATCH → NETWORK.

## Browser → bridge

```json
{"type":"send","clientMessageId":"tx-123","payloadHex":"01 01 ...","destinationId":"!11223344","portNum":256,"wantAck":true,"channelIndex":0}
```

Use `^all` for broadcast.

Other requests:

```json
{"type":"get_nodes"}
```

## Bridge → browser

Transmit accepted:

```json
{"type":"tx_accepted","clientMessageId":"tx-123","meshPacketId":123456}
```

Transport ACK:

```json
{"type":"transport_ack","clientMessageId":"tx-123","meshPacketId":123456}
```

Incoming FWP:

```json
{"type":"rx","payloadHex":"01 03 ...","fromId":"!11223344","rxSnr":7.5,"rxRssi":-91}
```

Node directory:

```json
{"type":"nodes","nodes":[{"id":"!11223344","shortName":"PINE","longName":"Pine Ridge","lat":39.5755,"lon":-78.564}]}
```

The reference bridge binds only to loopback by default and has no authentication/TLS. Do not expose it directly to an untrusted network.
