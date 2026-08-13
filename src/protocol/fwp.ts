import type { Confidence, FWPMessage, ObservationFlags, ObservationType, Urgency } from '../types';

const TYPE_CODE: Record<string, number> = { OBS:1, UPDATE:2, BEARING:3, ACK:4, CLEAR:5, REQUEST:6, STATUS:7 };
const OBS_CODE: Record<string, number> = {
  UNKNOWN:0, SMOKE:1, FIRE:2, FLAME:3, LIGHTNING:4, 'PRESCRIBED BURN':5, 'STRUCTURE FIRE':6, 'FALSE ALARM':7, CLEAR:8, OTHER:9
};
const CONF_CODE: Record<Confidence, number> = { UNKNOWN:0, LOW:1, MODERATE:2, HIGH:3, CONFIRMED:4 };
const URG_CODE: Record<Urgency, number> = { ROUTINE:0, IMPORTANT:1, EMERGENCY:2 };
const REV = <T extends Record<string, number>>(o:T) => Object.fromEntries(Object.entries(o).map(([k,v])=>[v,k]));
const TYPE_REV = REV(TYPE_CODE) as Record<number, FWPMessage['messageType']>;
const OBS_REV = REV(OBS_CODE) as Record<number, ObservationType>;
const CONF_REV = REV(CONF_CODE) as Record<number, Confidence>;
const URG_REV = REV(URG_CODE) as Record<number, Urgency>;

const reportBytes = (reportId: string) => {
  const clean = reportId.replace(/[^A-Fa-f0-9]/g,'').padEnd(6,'0').slice(0,6);
  return [parseInt(clean.slice(0,2),16)||0, parseInt(clean.slice(2,4),16)||0, parseInt(clean.slice(4,6),16)||0];
};

export const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join(' ').toUpperCase();
export const hexToBytes = (hex: string) => new Uint8Array(hex.replace(/[^0-9a-f]/gi,'').match(/.{1,2}/g)?.map(x=>parseInt(x,16)) ?? []);

export function flagsToWord(flags: ObservationFlags = {}) {
  const keys = ['smokeVisible','flameVisible','growing','column','drifting','intermittent','obscured','multiplePlumes','lightningAssociated','structureThreat','roadThreat','prescribedBurnPossible','humanActivitySeen','aircraftObserved','locationTriangulated','urgent'];
  return keys.reduce((acc,k,i)=>acc | (flags[k as keyof ObservationFlags] ? (1<<i) : 0),0) & 0xffff;
}

export function encodeFWP(message: FWPMessage) {
  const buffer = new ArrayBuffer(27);
  const view = new DataView(buffer);
  let o = 0;
  view.setUint8(o++, 1);
  view.setUint8(o++, TYPE_CODE[message.messageType] ?? 0);
  for (const b of reportBytes(message.reportId)) view.setUint8(o++, b);
  view.setUint8(o++, message.revision & 0xff);
  view.setUint32(o, Math.floor(new Date(message.timestamp).getTime()/1000), false); o+=4;
  view.setInt32(o, Math.round((message.targetLat ?? 0)*1e7), false); o+=4;
  view.setInt32(o, Math.round((message.targetLon ?? 0)*1e7), false); o+=4;
  view.setUint16(o, Math.round((message.bearingDeg ?? 0)*10), false); o+=2;
  view.setUint16(o, Math.min(65535, Math.round(message.rangeM ?? 0)), false); o+=2;
  view.setUint8(o++, OBS_CODE[message.eventType ?? 'UNKNOWN'] ?? 0);
  view.setUint8(o++, CONF_CODE[message.confidence ?? 'UNKNOWN']);
  view.setUint8(o++, URG_CODE[message.urgency ?? 'ROUTINE']);
  view.setUint16(o, message.flags ?? 0, false);
  const bytes = new Uint8Array(buffer);
  return { bytes, hex: bytesToHex(bytes) };
}

export function decodeFWP(bytes: Uint8Array) {
  if (bytes.length < 27) throw new Error('FWP/1 payload must be at least 27 bytes');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let o=0;
  const version = view.getUint8(o++);
  const messageType = TYPE_REV[view.getUint8(o++)] ?? 'OBS';
  const reportId = [view.getUint8(o++),view.getUint8(o++),view.getUint8(o++)].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  const revision = view.getUint8(o++);
  const timestamp = new Date(view.getUint32(o,false)*1000).toISOString(); o+=4;
  const targetLat = view.getInt32(o,false)/1e7; o+=4;
  const targetLon = view.getInt32(o,false)/1e7; o+=4;
  const bearingDeg = view.getUint16(o,false)/10; o+=2;
  const rangeM = view.getUint16(o,false); o+=2;
  const eventType = OBS_REV[view.getUint8(o++)] ?? 'UNKNOWN';
  const confidence = CONF_REV[view.getUint8(o++)] ?? 'UNKNOWN';
  const urgency = URG_REV[view.getUint8(o++)] ?? 'ROUTINE';
  const flags = view.getUint16(o,false);
  return { version, messageType, reportId, revision, timestamp, targetLat, targetLon, bearingDeg, rangeM, eventType, confidence, urgency, flags };
}
