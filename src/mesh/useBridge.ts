import { useEffect, useRef, useState } from 'react';
import type { AppSettings } from '../types';
import { FirewatchBridgeClient, type BridgeSnapshot } from './bridge';
import { ingestBridgePacket } from './ingest';

const disconnected: BridgeSnapshot = { state: 'DISCONNECTED', radioConnected: false, nodes: [] };

export function useBridge(settings: AppSettings | null | undefined) {
  const clientRef = useRef<FirewatchBridgeClient | null>(null);
  const [snapshot, setSnapshot] = useState<BridgeSnapshot>(disconnected);

  useEffect(() => {
    if (!settings) return;
    if (!clientRef.current) clientRef.current = new FirewatchBridgeClient(settings.bridgeUrl);
    const client = clientRef.current;
    client.setUrl(settings.bridgeUrl);
    const offState = client.onState(setSnapshot);
    const offEvent = client.onEvent(event => {
      if (event.type === 'packet' && event.direction === 'rx') {
        ingestBridgePacket(event).catch(error => console.error('FWP ingest failed', error));
      }
    });
    if (settings.meshMode === 'BRIDGE') client.connect(); else client.disconnect();
    return () => { offState(); offEvent(); };
  }, [settings?.meshMode, settings?.bridgeUrl]);

  useEffect(() => () => clientRef.current?.disconnect(), []);
  return { client: clientRef.current, snapshot };
}
