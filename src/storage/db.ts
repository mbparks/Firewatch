import Dexie, { type Table } from 'dexie';
import type { AppSettings, Bearing, Equipment, FieldUpdate, FWPMessage, GeneratedReport, HorizonAnnotation, HorizonPanorama, Incident, Landmark, LightningEvent, MaintenanceEntry, Observation, Procedure, ProcedureRun, RadioLog, Sector, ShiftLogEntry, ShiftRecord, StationPresence, SyncConflict, SyncStatusRecord, TerrainSample, Tower, TowerContact, VisibilityObservation, WatchItem, WeatherObservation, WeatherSourceConfig } from '../types';

export class FirewatchDB extends Dexie {
  towers!: Table<Tower, string>;
  landmarks!: Table<Landmark, string>;
  observations!: Table<Observation, string>;
  bearings!: Table<Bearing, string>;
  incidents!: Table<Incident, string>;
  watchItems!: Table<WatchItem, string>;
  weather!: Table<WeatherObservation, string>;
  weatherSources!: Table<WeatherSourceConfig, string>;
  visibilityObservations!: Table<VisibilityObservation, string>;
  radioLogs!: Table<RadioLog, string>;
  shiftLogs!: Table<ShiftLogEntry, string>;
  shifts!: Table<ShiftRecord, string>;
  sectors!: Table<Sector, string>;
  equipment!: Table<Equipment, string>;
  maintenance!: Table<MaintenanceEntry, string>;
  procedures!: Table<Procedure, string>;
  procedureRuns!: Table<ProcedureRun, string>;
  contacts!: Table<TowerContact, string>;
  reports!: Table<GeneratedReport, string>;
  meshMessages!: Table<FWPMessage, string>;
  fieldUpdates!: Table<FieldUpdate, string>;
  stationPresence!: Table<StationPresence, string>;
  syncConflicts!: Table<SyncConflict, string>;
  syncStatus!: Table<SyncStatusRecord, string>;
  panoramas!: Table<HorizonPanorama, string>;
  horizonAnnotations!: Table<HorizonAnnotation, string>;
  lightning!: Table<LightningEvent, string>;
  terrainSamples!: Table<TerrainSample, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('firewatch');
    const base = {
      towers: 'id, name, local', landmarks: 'id, name, type', observations: 'id, reportId, createdAt, towerId, incidentId, type, weatherObservationId', bearings: 'id, reportId, createdAt, towerId, incidentId', incidents: 'id, reportId, status, createdAt, updatedAt', watchItems: 'id, priority, status, dueAt, incidentId, reportId', weather: 'id, timestamp, source, sourceName', radioLogs: 'id, timestamp, incidentId', shiftLogs: 'id, timestamp, incidentId', sectors: 'id, startDeg, lastScannedAt', equipment: 'id, status', meshMessages: 'id, reportId, messageType, timestamp, originNode, deliveryState', settings: 'id'
    } as const;
    this.version(1).stores({...base, watchItems:'id, priority, status, dueAt, incidentId'});
    this.version(2).stores(base).upgrade(async tx => {
      const settings = await tx.table('settings').get('settings');
      if (settings) await tx.table('settings').put({...settings,version:'0.3.0',meshMode:settings.meshMode??'SIMULATED',bridgeUrl:settings.bridgeUrl??'ws://127.0.0.1:8765',fwpPortNum:settings.fwpPortNum??256});
    });
    this.version(3).stores({
      ...base,
      panoramas: 'id, towerId, createdAt',
      horizonAnnotations: 'id, panoramaId, landmarkId, bearingDeg',
      lightning: 'id, timestamp, clusterId, status, source',
      terrainSamples: 'id, lat, lon, elevationM, source'
    }).upgrade(async tx => {
      const settings = await tx.table('settings').get('settings');
      if (settings) await tx.table('settings').put({...settings,version:'0.6.0',viewshedEnabled:settings.viewshedEnabled??false,viewshedRangeM:settings.viewshedRangeM??30000});
    });
    this.version(4).stores({
      ...base,
      panoramas: 'id, towerId, createdAt',
      horizonAnnotations: 'id, panoramaId, landmarkId, bearingDeg',
      lightning: 'id, timestamp, clusterId, status, source',
      terrainSamples: 'id, lat, lon, elevationM, source',
      weatherSources: 'id, kind, enabled, lastSuccessAt',
      visibilityObservations: 'id, timestamp, landmarkId, visible',
      shifts: 'id, towerId, status, startedAt, endedAt',
      maintenance: 'id, equipmentId, timestamp, kind',
      procedures: 'id, category, title',
      procedureRuns: 'id, procedureId, shiftId, startedAt, completedAt',
      contacts: 'id, name, role, callsign',
      reports: 'id, type, generatedAt, incidentId, shiftId'
    }).upgrade(async tx => {
      const settings = await tx.table('settings').get('settings');
      if (settings) await tx.table('settings').put({...settings,version:'0.8.0',weatherAutoPoll:settings.weatherAutoPoll??true});
    });
    this.version(5).stores({
      ...base,
      panoramas: 'id, towerId, createdAt', horizonAnnotations: 'id, panoramaId, landmarkId, bearingDeg', lightning: 'id, timestamp, clusterId, status, source', terrainSamples: 'id, lat, lon, elevationM, source',
      weatherSources: 'id, kind, enabled, lastSuccessAt', visibilityObservations: 'id, timestamp, landmarkId, visible', shifts: 'id, towerId, status, startedAt, endedAt', maintenance: 'id, equipmentId, timestamp, kind', procedures: 'id, category, title', procedureRuns: 'id, procedureId, shiftId, startedAt, completedAt', contacts: 'id, name, role, callsign', reports: 'id, type, generatedAt, incidentId, shiftId',
      fieldUpdates: 'id, incidentId, reportId, timestamp, stationId, type, source', stationPresence: 'id, stationId, role, timestamp', syncConflicts: 'id, entityType, entityId, detectedAt, status', syncStatus: 'id'
    }).upgrade(async tx => {
      const settings:any = await tx.table('settings').get('settings');
      if (settings) await tx.table('settings').put({...settings,version:'1.0.1',stationRole:settings.stationRole??'LOOKOUT',stationId:settings.stationId??settings.activeTowerId??'LOCAL',syncEnabled:settings.syncEnabled??false,syncServerUrl:settings.syncServerUrl??'http://127.0.0.1:8790',syncIntervalSeconds:settings.syncIntervalSeconds??60,sharePresence:settings.sharePresence??true,fieldPositionMode:settings.fieldPositionMode??'MANUAL'});
      await tx.table('syncStatus').put({id:'sync',cursor:0,pushedRecords:0,pulledRecords:0,consecutiveFailures:0});
    });
  }
}

export const db = new FirewatchDB();

const TABLES = ['towers','landmarks','observations','bearings','incidents','watchItems','weather','weatherSources','visibilityObservations','radioLogs','shiftLogs','shifts','sectors','equipment','maintenance','procedures','procedureRuns','contacts','reports','meshMessages','fieldUpdates','stationPresence','syncConflicts','syncStatus','panoramas','horizonAnnotations','lightning','terrainSamples','settings'] as const;

export async function exportBackup() {
  const data: Record<string, unknown> = { format: 'FIREWATCH_BACKUP', version: '1.0.1', exportedAt: new Date().toISOString() };
  for (const name of TABLES) data[name] = await db.table(name).toArray();
  return data;
}

export async function importBackup(data: Record<string, unknown>) {
  if (data.format !== 'FIREWATCH_BACKUP') throw new Error('Not a FIREWATCH backup');
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLES) {
      const table = db.table(name); await table.clear(); let rows = data[name];
      if (name === 'settings' && Array.isArray(rows)) rows = rows.map((row:any)=>({...row,version:'1.0.1',meshMode:row.meshMode??'SIMULATED',bridgeUrl:row.bridgeUrl??'ws://127.0.0.1:8765',fwpPortNum:row.fwpPortNum??256,viewshedEnabled:row.viewshedEnabled??false,viewshedRangeM:row.viewshedRangeM??30000,weatherAutoPoll:row.weatherAutoPoll??true,stationRole:row.stationRole??'LOOKOUT',stationId:row.stationId??row.activeTowerId??'LOCAL',syncEnabled:row.syncEnabled??false,syncServerUrl:row.syncServerUrl??'http://127.0.0.1:8790',syncIntervalSeconds:row.syncIntervalSeconds??60,sharePresence:row.sharePresence??true,fieldPositionMode:row.fieldPositionMode??'MANUAL'}));
      if (Array.isArray(rows) && rows.length) await table.bulkAdd(rows);
    }
  });
}
