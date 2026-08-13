import { db } from '../storage/db';
import type { AppSettings, Bearing, FieldUpdate, Incident, Observation, RadioLog, ShiftLogEntry, StationPresence, SyncConflict, SyncEntityType, SyncStatusRecord, WatchItem } from '../types';
import { makeId } from '../utils/ids';

export type SyncRecord = { entityType: SyncEntityType; entityId: string; updatedAt: string; payload: unknown };
export type SyncEvent = SyncRecord & { seq: number; originStationId: string };

function stamp(entityType: SyncEntityType, value: any): string {
  if (entityType === 'INCIDENT' || entityType === 'OBSERVATION') return value.updatedAt || value.createdAt || new Date(0).toISOString();
  return value.timestamp || value.createdAt || value.dueAt || new Date(0).toISOString();
}

export async function collectSyncRecords(settings: AppSettings): Promise<SyncRecord[]> {
  const sets: [SyncEntityType, any[]][] = [
    ['INCIDENT', await db.incidents.toArray()],
    ['OBSERVATION', await db.observations.toArray()],
    ['BEARING', await db.bearings.toArray()],
    ['WATCH_ITEM', await db.watchItems.toArray()],
    ['RADIO_LOG', await db.radioLogs.toArray()],
    ['SHIFT_LOG', await db.shiftLogs.toArray()],
    ['FIELD_UPDATE', (await db.fieldUpdates.toArray()).filter(x=>x.source==='LOCAL')],
  ];
  if (settings.sharePresence) {
    const tower = await db.towers.get(settings.activeTowerId);
    if (tower) {
      const presence: StationPresence = {
        id: `presence-${settings.stationId}`,
        stationId: settings.stationId,
        stationName: tower.name,
        role: settings.stationRole,
        timestamp: new Date().toISOString(),
        lat: tower.lat,
        lon: tower.lon,
        internetState: navigator.onLine ? 'LIVE' : 'OFFLINE',
      };
      sets.push(['PRESENCE', [presence]]);
    }
  }
  return sets.flatMap(([entityType, rows]) => rows.map(value => ({ entityType, entityId: value.id, updatedAt: stamp(entityType, value), payload: value })));
}

async function localFor(type: SyncEntityType, id: string): Promise<any | undefined> {
  switch(type){
    case 'INCIDENT': return db.incidents.get(id); case 'OBSERVATION': return db.observations.get(id); case 'BEARING': return db.bearings.get(id);
    case 'WATCH_ITEM': return db.watchItems.get(id); case 'RADIO_LOG': return db.radioLogs.get(id); case 'SHIFT_LOG': return db.shiftLogs.get(id);
    case 'FIELD_UPDATE': return db.fieldUpdates.get(id); case 'PRESENCE': return db.stationPresence.get(id);
  }
}
async function put(type: SyncEntityType, payload: any) {
  switch(type){
    case 'INCIDENT': return db.incidents.put(payload as Incident); case 'OBSERVATION': return db.observations.put(payload as Observation); case 'BEARING': return db.bearings.put(payload as Bearing);
    case 'WATCH_ITEM': return db.watchItems.put(payload as WatchItem); case 'RADIO_LOG': return db.radioLogs.put(payload as RadioLog); case 'SHIFT_LOG': return db.shiftLogs.put(payload as ShiftLogEntry);
    case 'FIELD_UPDATE': return db.fieldUpdates.put({...payload,source:'REMOTE'} as FieldUpdate); case 'PRESENCE': return db.stationPresence.put(payload as StationPresence);
  }
}

export async function applySyncEvents(events: SyncEvent[], localStationId: string) {
  let applied=0, conflicts=0;
  for (const event of events) {
    if (event.originStationId === localStationId) continue;
    const local = await localFor(event.entityType,event.entityId);
    if (!local) { await put(event.entityType,event.payload); applied++; continue; }
    const localStamp=stamp(event.entityType,local), remoteStamp=event.updatedAt;
    const localJson=JSON.stringify(local), remoteJson=JSON.stringify(event.payload);
    if (remoteStamp > localStamp) { await put(event.entityType,event.payload); applied++; }
    else if (remoteStamp === localStamp && localJson !== remoteJson) {
      const existing=(await db.syncConflicts.where('entityId').equals(event.entityId).toArray()).find(c=>c.status==='OPEN'&&c.remoteJson===remoteJson);
      if(!existing){const c:SyncConflict={id:makeId('conflict'),entityType:event.entityType,entityId:event.entityId,detectedAt:new Date().toISOString(),localUpdatedAt:localStamp,remoteUpdatedAt:remoteStamp,remoteStationId:event.originStationId,localJson,remoteJson,status:'OPEN'};await db.syncConflicts.add(c);conflicts++;}
    }
  }
  return {applied,conflicts};
}

export async function getSyncStatus(): Promise<SyncStatusRecord> {
  return (await db.syncStatus.get('sync')) || {id:'sync',cursor:0,pushedRecords:0,pulledRecords:0,consecutiveFailures:0};
}
