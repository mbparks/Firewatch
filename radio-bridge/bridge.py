#!/usr/bin/env python3
"""FIREWATCH Radio Bridge v0.3.0

Local WebSocket <-> Meshtastic adapter for FWP/1 payload bytes.
No incident semantics live here: this process only moves bytes, exposes node/radio
health, and persists outbound packets while the radio is unavailable.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
from pathlib import Path
from typing import Any

from pubsub import pub
from websockets.asyncio.server import serve

import meshtastic
import meshtastic.serial_interface
import meshtastic.tcp_interface

BRIDGE_VERSION = "0.3.0"
DEFAULT_PORT = 256
BROADCAST = "^all"

log = logging.getLogger("firewatch.bridge")


class Bridge:
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.clients: set[Any] = set()
        self.interface: Any | None = None
        self.loop: asyncio.AbstractEventLoop | None = None
        self.radio_connected = False
        self.node_id: str | None = None
        self.queue_path = Path(args.queue_file)
        self.pending: list[dict[str, Any]] = self._load_queue()

    def _load_queue(self) -> list[dict[str, Any]]:
        try:
            if self.queue_path.exists():
                data = json.loads(self.queue_path.read_text())
                if isinstance(data, list):
                    return data
        except Exception as exc:
            log.warning("Could not load queue: %s", exc)
        return []

    def _save_queue(self) -> None:
        self.queue_path.parent.mkdir(parents=True, exist_ok=True)
        self.queue_path.write_text(json.dumps(self.pending, indent=2))

    def start_radio(self) -> None:
        pub.subscribe(self.on_receive, "meshtastic.receive.data")
        pub.subscribe(self.on_connected, "meshtastic.connection.established")
        pub.subscribe(self.on_lost, "meshtastic.connection.lost")
        pub.subscribe(self.on_node_updated, "meshtastic.node.updated")
        if self.args.tcp_host:
            log.info("Connecting to Meshtastic TCP interface at %s", self.args.tcp_host)
            self.interface = meshtastic.tcp_interface.TCPInterface(hostname=self.args.tcp_host)
        else:
            log.info("Connecting to Meshtastic serial interface %s", self.args.device or "(auto-detect)")
            self.interface = meshtastic.serial_interface.SerialInterface(devPath=self.args.device) if self.args.device else meshtastic.serial_interface.SerialInterface()

    def close_radio(self) -> None:
        try:
            if self.interface:
                self.interface.close()
        except Exception:
            pass

    def on_connected(self, interface: Any, topic: Any = None) -> None:
        self.interface = interface
        self.radio_connected = True
        try:
            info = interface.getMyNodeInfo() or {}
            self.node_id = info.get("user", {}).get("id") or info.get("user", {}).get("shortName")
        except Exception:
            self.node_id = None
        self._emit_threadsafe({"type": "radio", "connected": True, "nodeId": self.node_id})
        self._emit_nodes_threadsafe()
        if self.loop:
            asyncio.run_coroutine_threadsafe(self.flush_pending(), self.loop)

    def on_lost(self, interface: Any = None, topic: Any = None) -> None:
        self.radio_connected = False
        self._emit_threadsafe({"type": "radio", "connected": False, "nodeId": self.node_id, "error": "Meshtastic connection lost"})

    def on_node_updated(self, node: Any = None, topic: Any = None) -> None:
        self._emit_nodes_threadsafe()

    def on_receive(self, packet: dict[str, Any], interface: Any = None, topic: Any = None) -> None:
        decoded = packet.get("decoded", {})
        port = decoded.get("portnum")
        # Python API commonly renders enum 256 as PRIVATE_APP; accept numeric too.
        if port not in (self.args.port, "PRIVATE_APP", str(self.args.port)):
            return
        payload = decoded.get("payload")
        if not isinstance(payload, (bytes, bytearray)):
            return
        event = {
            "type": "packet",
            "direction": "rx",
            "payloadHex": bytes(payload).hex(" ").upper(),
            "fromId": packet.get("fromId") or self._node_id_from_num(packet.get("from")),
            "toId": packet.get("toId"),
            "packetId": packet.get("id"),
            "channel": packet.get("channel"),
            "rxSnr": packet.get("rxSnr"),
            "rxRssi": packet.get("rxRssi"),
            "hopLimit": packet.get("hopLimit"),
        }
        self._emit_threadsafe(event)

    def _node_id_from_num(self, node_num: Any) -> str | None:
        if self.interface is None or node_num is None:
            return None
        try:
            row = self.interface.nodesByNum.get(node_num, {})
            return row.get("user", {}).get("id")
        except Exception:
            return None

    def nodes(self) -> list[dict[str, Any]]:
        if not self.interface:
            return []
        result: list[dict[str, Any]] = []
        try:
            for node_id, row in self.interface.nodes.items():
                user = row.get("user", {})
                result.append({
                    "id": user.get("id") or node_id,
                    "nodeNum": row.get("num"),
                    "longName": user.get("longName"),
                    "shortName": user.get("shortName"),
                    "lastHeard": row.get("lastHeard"),
                    "snr": row.get("snr"),
                })
        except Exception as exc:
            log.debug("Node list unavailable: %s", exc)
        return result

    def _emit_nodes_threadsafe(self) -> None:
        self._emit_threadsafe({"type": "nodes", "nodes": self.nodes()})

    def _emit_threadsafe(self, event: dict[str, Any]) -> None:
        if self.loop:
            asyncio.run_coroutine_threadsafe(self.broadcast(event), self.loop)

    async def broadcast(self, event: dict[str, Any]) -> None:
        if not self.clients:
            return
        wire = json.dumps(event)
        dead = []
        for ws in tuple(self.clients):
            try:
                await ws.send(wire)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.clients.discard(ws)

    async def handler(self, websocket: Any) -> None:
        self.clients.add(websocket)
        await websocket.send(json.dumps({
            "type": "hello", "bridgeVersion": BRIDGE_VERSION,
            "radioConnected": self.radio_connected, "portNum": self.args.port,
            "nodeId": self.node_id,
        }))
        try:
            async for raw in websocket:
                try:
                    message = json.loads(raw)
                    await self.handle_command(websocket, message)
                except Exception as exc:
                    await websocket.send(json.dumps({"type": "error", "message": str(exc)}))
        finally:
            self.clients.discard(websocket)

    async def handle_command(self, websocket: Any, message: dict[str, Any]) -> None:
        kind = message.get("type")
        if kind == "hello":
            await websocket.send(json.dumps({"type": "hello", "bridgeVersion": BRIDGE_VERSION, "radioConnected": self.radio_connected, "portNum": self.args.port, "nodeId": self.node_id}))
        elif kind == "get_nodes":
            await websocket.send(json.dumps({"type": "nodes", "nodes": self.nodes()}))
        elif kind == "send":
            await self.queue_or_send(message)
        else:
            raise ValueError(f"Unknown bridge command: {kind}")

    async def queue_or_send(self, request: dict[str, Any]) -> None:
        payload_hex = str(request.get("payloadHex", ""))
        payload = bytes.fromhex(payload_hex)
        if len(payload) == 0:
            raise ValueError("Empty payload")
        queued = {
            "clientMessageId": request.get("clientMessageId"),
            "payloadHex": payload.hex(" ").upper(),
            "targetNode": request.get("targetNode") or BROADCAST,
            "wantAck": bool(request.get("wantAck", True)),
        }
        if not self.radio_connected or not self.interface:
            self.pending.append(queued)
            self._save_queue()
            await self.broadcast({"type": "delivery", "clientMessageId": queued["clientMessageId"], "state": "QUEUED"})
            return
        await self.send_now(queued)

    async def flush_pending(self) -> None:
        if not self.radio_connected or not self.interface or not self.pending:
            return
        queued = list(self.pending)
        self.pending.clear()
        self._save_queue()
        for item in queued:
            try:
                await self.send_now(item)
            except Exception as exc:
                log.warning("Queued send failed: %s", exc)
                self.pending.append(item)
                self._save_queue()
                await self.broadcast({"type": "delivery", "clientMessageId": item.get("clientMessageId"), "state": "FAILED", "error": str(exc)})
                break

    async def send_now(self, item: dict[str, Any]) -> None:
        payload = bytes.fromhex(item["payloadHex"])
        destination = item.get("targetNode") or BROADCAST
        # Reliable ACKs are meaningful for directed packets. Keep broadcasts quiet.
        want_ack = bool(item.get("wantAck")) and destination != BROADCAST
        client_id = item.get("clientMessageId")

        def on_response(packet: dict[str, Any]) -> None:
            decoded = packet.get("decoded", {})
            routing = decoded.get("routing", {})
            reason = routing.get("errorReason", "NONE")
            state = "DELIVERED" if reason in (None, "NONE") else "FAILED"
            self._emit_threadsafe({"type": "delivery", "clientMessageId": client_id, "state": state, "error": None if state == "DELIVERED" else str(reason)})

        sent = self.interface.sendData(
            payload,
            destinationId=destination,
            portNum=self.args.port,
            wantAck=want_ack,
            wantResponse=False,
            onResponse=on_response if want_ack else None,
            onResponseAckPermitted=want_ack,
            channelIndex=self.args.channel,
        )
        packet_id = getattr(sent, "id", None)
        await self.broadcast({"type": "delivery", "clientMessageId": client_id, "packetId": packet_id, "state": "SENT"})
        await self.broadcast({"type": "packet", "direction": "tx", "payloadHex": item["payloadHex"], "toId": destination, "packetId": packet_id, "channel": self.args.channel})
        if not want_ack:
            # Broadcast transmission is queued to the radio, but not operationally acknowledged.
            return


async def main_async(args: argparse.Namespace) -> None:
    bridge = Bridge(args)
    bridge.loop = asyncio.get_running_loop()
    try:
        await asyncio.to_thread(bridge.start_radio)
    except Exception as exc:
        log.error("Radio connection failed: %s", exc)
        bridge.radio_connected = False
    log.info("FIREWATCH bridge listening on ws://%s:%s (FWP port %s)", args.host, args.ws_port, args.port)
    async with serve(bridge.handler, args.host, args.ws_port, max_size=65536):
        try:
            await asyncio.Future()
        finally:
            bridge.close_radio()


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="FIREWATCH Meshtastic radio bridge")
    p.add_argument("--device", help="Serial device, e.g. /dev/ttyACM0 or COM5. Omit for auto-detect.")
    p.add_argument("--tcp-host", help="Use Meshtastic TCPInterface instead of serial.")
    p.add_argument("--host", default="127.0.0.1", help="WebSocket bind host (default: 127.0.0.1)")
    p.add_argument("--ws-port", type=int, default=8765, help="WebSocket port (default: 8765)")
    p.add_argument("--port", type=int, default=DEFAULT_PORT, choices=range(256, 512), metavar="256..511", help="Meshtastic private PortNum (default: 256)")
    p.add_argument("--channel", type=int, default=0, help="Meshtastic channel index (default: 0)")
    p.add_argument("--queue-file", default=str(Path.home()/".firewatch"/"radio-queue.json"), help="Persistent outbound queue path")
    p.add_argument("--debug", action="store_true")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    logging.basicConfig(level=logging.DEBUG if args.debug else logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        pass
