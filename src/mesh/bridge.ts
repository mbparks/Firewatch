import type { BridgeNode, BridgeState, FWPMessage } from '../types';

export type BridgeEvent =
  | { type: 'hello'; bridgeVersion?: string; radioConnected: boolean; portNum: number; nodeId?: string }
  | { type: 'radio'; connected: boolean; nodeId?: string; error?: string }
  | { type: 'nodes'; nodes: BridgeNode[] }
  | { type: 'packet'; direction: 'rx' | 'tx'; payloadHex: string; fromId?: string; toId?: string; packetId?: number; channel?: number; rxSnr?: number; rxRssi?: number; hopLimit?: number }
  | { type: 'delivery'; clientMessageId?: string; packetId?: number; state: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED'; error?: string }
  | { type: 'error'; message: string };

export interface BridgeSnapshot {
  state: BridgeState;
  radioConnected: boolean;
  nodeId?: string;
  nodes: BridgeNode[];
  error?: string;
}

export class FirewatchBridgeClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | undefined;
  private stopped = true;
  private listeners = new Set<(event: BridgeEvent) => void>();
  private stateListeners = new Set<(snapshot: BridgeSnapshot) => void>();
  private snapshot: BridgeSnapshot = { state: 'DISCONNECTED', radioConnected: false, nodes: [] };

  constructor(private url: string) {}

  setUrl(url: string) {
    if (url === this.url) return;
    this.url = url;
    if (!this.stopped) {
      this.disconnect();
      this.connect();
    }
  }

  getSnapshot() { return this.snapshot; }

  onEvent(listener: (event: BridgeEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onState(listener: (snapshot: BridgeSnapshot) => void) {
    this.stateListeners.add(listener);
    listener(this.snapshot);
    return () => this.stateListeners.delete(listener);
  }

  connect() {
    this.stopped = false;
    this.open();
  }

  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.ws?.close();
    this.ws = null;
    this.update({ state: 'DISCONNECTED', radioConnected: false });
  }

  sendFWP(message: FWPMessage, payloadHex: string, options?: { targetNode?: string; wantAck?: boolean }) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('Radio bridge is not connected');
    this.ws.send(JSON.stringify({
      type: 'send',
      clientMessageId: message.id,
      payloadHex,
      targetNode: options?.targetNode ?? message.targetNode,
      wantAck: options?.wantAck ?? true,
    }));
  }

  requestNodes() {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'get_nodes' }));
  }

  private open() {
    if (this.stopped) return;
    this.update({ state: 'CONNECTING', error: undefined });
    try {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      ws.onopen = () => {
        this.update({ state: 'CONNECTED' });
        ws.send(JSON.stringify({ type: 'hello', client: 'FIREWATCH', protocol: 1 }));
        ws.send(JSON.stringify({ type: 'get_nodes' }));
      };
      ws.onmessage = evt => {
        try {
          const event = JSON.parse(String(evt.data)) as BridgeEvent;
          if (event.type === 'hello') this.update({ radioConnected: event.radioConnected, nodeId: event.nodeId, state: event.radioConnected ? 'CONNECTED' : 'RADIO_OFFLINE' });
          if (event.type === 'radio') this.update({ radioConnected: event.connected, nodeId: event.nodeId, state: event.connected ? 'CONNECTED' : 'RADIO_OFFLINE', error: event.error });
          if (event.type === 'nodes') this.update({ nodes: event.nodes });
          if (event.type === 'error') this.update({ error: event.message });
          this.listeners.forEach(listener => listener(event));
        } catch (error) {
          this.update({ error: `Invalid bridge event: ${error instanceof Error ? error.message : String(error)}` });
        }
      };
      ws.onerror = () => this.update({ state: 'ERROR', error: 'WebSocket connection error' });
      ws.onclose = () => {
        this.ws = null;
        if (this.stopped) return;
        this.update({ state: 'DISCONNECTED', radioConnected: false });
        this.reconnectTimer = window.setTimeout(() => this.open(), 3000);
      };
    } catch (error) {
      this.update({ state: 'ERROR', error: error instanceof Error ? error.message : String(error) });
      this.reconnectTimer = window.setTimeout(() => this.open(), 3000);
    }
  }

  private update(patch: Partial<BridgeSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.stateListeners.forEach(listener => listener(this.snapshot));
  }
}
