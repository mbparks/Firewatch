import { db } from '../storage/db';
import type { Bearing, FWPMessage, Observation, Tower, WatchItem } from '../types';
import { decodeFWP, hexToBytes } from '../protocol/fwp';
import { makeId } from '../utils/ids';
import { triangulateBearings } from '../triangulation/geometry';
import type { BridgeEvent } from './bridge';

function zeroAsUndefined(value: number) { return value === 0 ? undefined : value; }

export async function ingestBridgePacket(event: Extract<BridgeEvent, { type: 'packet' }>) {
  if (event.direction !== 'rx') return;
  const decoded = decodeFWP(hexToBytes(event.payloadHex));
  if (decoded.version !== 1) throw new Error(`Unsupported FWP version ${decoded.version}`);

  const duplicate = await db.meshMessages
    .where('reportId').equals(decoded.reportId)
    .and(m => m.messageType === decoded.messageType && m.revision === decoded.revision && m.originNode === (event.fromId || 'UNKNOWN'))
    .first();
  if (duplicate) return;

  const message: FWPMessage = {
    id: makeId('mesh'),
    version: 1,
    messageType: decoded.messageType,
    reportId: decoded.reportId,
    revision: decoded.revision,
    timestamp: decoded.timestamp,
    originNode: event.fromId || 'UNKNOWN',
    targetLat: zeroAsUndefined(decoded.targetLat),
    targetLon: zeroAsUndefined(decoded.targetLon),
    bearingDeg: zeroAsUndefined(decoded.bearingDeg),
    rangeM: zeroAsUndefined(decoded.rangeM),
    eventType: decoded.eventType,
    confidence: decoded.confidence,
    urgency: decoded.urgency,
    flags: decoded.flags,
    transport: 'MESHTASTIC',
    payloadHex: event.payloadHex,
    payloadBytes: hexToBytes(event.payloadHex).length,
    meshPacketId: event.packetId,
    channel: event.channel,
    rxSnr: event.rxSnr,
    rxRssi: event.rxRssi,
    hopLimit: event.hopLimit,
    deliveryState: 'DELIVERED',
  };
  await db.meshMessages.add(message);

  const towers = await db.towers.toArray();
  const remoteTower = resolveTower(event.fromId, towers);
  const incident = await db.incidents.where('reportId').equals(decoded.reportId).first();

  if (decoded.messageType === 'OBS' || decoded.messageType === 'UPDATE') {
    const existing = await db.observations.where('reportId').equals(decoded.reportId).first();
    if (!existing && remoteTower) {
      const observation: Observation = {
        id: makeId('obs'),
        reportId: decoded.reportId,
        createdAt: decoded.timestamp,
        updatedAt: decoded.timestamp,
        towerId: remoteTower.id,
        type: decoded.eventType,
        confidence: decoded.confidence,
        urgency: decoded.urgency,
        bearingDeg: decoded.bearingDeg,
        bearingUncertaintyDeg: 0.5,
        rangeM: zeroAsUndefined(decoded.rangeM),
        targetLat: zeroAsUndefined(decoded.targetLat),
        targetLon: zeroAsUndefined(decoded.targetLon),
        targetMethod: decoded.targetLat || decoded.targetLon ? 'REMOTE REPORT' : undefined,
        flags: {},
        source: 'REMOTE',
        incidentId: incident?.id,
      };
      await db.observations.add(observation);
      if (decoded.bearingDeg > 0) {
        await db.bearings.add({
          id: makeId('bearing'), reportId: decoded.reportId, incidentId: incident?.id, towerId: remoteTower.id,
          bearingDeg: decoded.bearingDeg, uncertaintyDeg: 0.5, createdAt: decoded.timestamp, source: 'REMOTE',
        });
      }
    } else if (existing) {
      await db.observations.update(existing.id, {
        updatedAt: decoded.timestamp,
        type: decoded.eventType,
        confidence: decoded.confidence,
        urgency: decoded.urgency,
        targetLat: zeroAsUndefined(decoded.targetLat) ?? existing.targetLat,
        targetLon: zeroAsUndefined(decoded.targetLon) ?? existing.targetLon,
      });
    }
    const localTower = towers.find(t => t.local);
    if (localTower && remoteTower?.id !== localTower.id) {
      const watch: WatchItem = {
        id: makeId('watch'),
        title: `${decoded.eventType} report ${decoded.reportId}`,
        priority: decoded.urgency === 'EMERGENCY' ? 'HIGH' : 'MEDIUM',
        reason: `Remote report from ${remoteTower?.name || event.fromId || 'mesh node'} — verify visually`,
        targetLat: zeroAsUndefined(decoded.targetLat),
        targetLon: zeroAsUndefined(decoded.targetLon),
        reportId: decoded.reportId,
        incidentId: incident?.id,
        status: 'OPEN',
      };
      const sameOpen = await db.watchItems.where('status').equals('OPEN').filter(w => w.reportId === decoded.reportId).first();
      if (!sameOpen) await db.watchItems.add(watch);
    }
  }

  if (decoded.messageType === 'REQUEST') {
    const sameOpen = await db.watchItems.where('status').equals('OPEN').filter(w => w.reportId === decoded.reportId && w.reason.includes('Bearing request')).first();
    if (!sameOpen) {
      await db.watchItems.add({
        id: makeId('watch'),
        title: `Bearing requested · ${decoded.reportId}`,
        priority: decoded.urgency === 'EMERGENCY' ? 'HIGH' : 'MEDIUM',
        reason: `Bearing request from ${remoteTower?.name || event.fromId || 'mesh node'} — use LOOK HERE, measure the smoke, then answer in MAP → MESH`,
        targetLat: zeroAsUndefined(decoded.targetLat),
        targetLon: zeroAsUndefined(decoded.targetLon),
        reportId: decoded.reportId,
        incidentId: incident?.id,
        status: 'OPEN',
      });
    }
  }

  if (decoded.messageType === 'BEARING' && remoteTower && decoded.bearingDeg > 0) {
    const existingBearing = await db.bearings.where('reportId').equals(decoded.reportId).filter(b => b.towerId === remoteTower.id).first();
    const bearing: Bearing = {
      id: existingBearing?.id || makeId('bearing'), reportId: decoded.reportId, incidentId: incident?.id,
      towerId: remoteTower.id, bearingDeg: decoded.bearingDeg, uncertaintyDeg: 0.5,
      createdAt: decoded.timestamp, source: 'REMOTE',
    };
    if (existingBearing) await db.bearings.put(bearing); else await db.bearings.add(bearing);
    await retriangulate(decoded.reportId);
  }

  if (decoded.messageType === 'ACK') {
    const related = await db.meshMessages.where('reportId').equals(decoded.reportId).toArray();
    await Promise.all(related.filter(m => m.transport === 'MESHTASTIC' && m.originNode !== event.fromId).map(m => db.meshMessages.update(m.id, { humanAck: true })));
  }

  await db.shiftLogs.add({
    id: makeId('log'), timestamp: decoded.timestamp, kind: 'MESH',
    message: `${decoded.messageType} ${decoded.reportId} received from ${remoteTower?.name || event.fromId || 'unknown node'}`,
    incidentId: incident?.id,
  });
}

export async function retriangulate(reportId: string) {
  const [bearings, towers, incident] = await Promise.all([
    db.bearings.where('reportId').equals(reportId).toArray(),
    db.towers.toArray(),
    db.incidents.where('reportId').equals(reportId).first(),
  ]);
  if (!incident || bearings.length < 2) return null;
  const tri = triangulateBearings(bearings, towers);
  if (!tri) return null;
  const now = new Date().toISOString();
  await db.incidents.update(incident.id, {
    targetLat: tri.lat,
    targetLon: tri.lon,
    uncertaintyM: tri.uncertaintyM,
    locationMethod: 'TRIANGULATION',
    geometryQuality: tri.geometryQuality,
    rmsResidualDeg: tri.rmsResidualDeg,
    uncertaintyEllipse: tri.ellipse,
    triangulationResiduals: tri.residuals,
    triangulationUpdatedAt: now,
    updatedAt: now,
  });
  await db.shiftLogs.add({
    id: makeId('log'), timestamp: now, kind: 'ANALYSIS',
    message: `${reportId} triangulated from ${bearings.length} bearings — ${tri.geometryQuality}, RMS ${tri.rmsResidualDeg.toFixed(2)}°`,
    incidentId: incident.id,
  });
  return tri;
}

function resolveTower(nodeId: string | undefined, towers: Tower[]) {
  if (!nodeId) return undefined;
  const normalized = nodeId.trim().toLowerCase();
  return towers.find(t => t.meshtasticNodeId?.toLowerCase() === normalized || t.callsign?.toLowerCase() === normalized || t.name.toLowerCase() === normalized);
}
