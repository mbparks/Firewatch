export type Confidence = 'UNKNOWN' | 'LOW' | 'MODERATE' | 'HIGH' | 'CONFIRMED';
export type Urgency = 'ROUTINE' | 'IMPORTANT' | 'EMERGENCY';
export type ObservationType = 'UNKNOWN' | 'SMOKE' | 'FIRE' | 'FLAME' | 'LIGHTNING' | 'PRESCRIBED BURN' | 'STRUCTURE FIRE' | 'FALSE ALARM' | 'CLEAR' | 'OTHER';
export type IncidentStatus = 'SIGHTING' | 'SUSPECTED' | 'REPORTED' | 'CONFIRMED' | 'RESPONDING' | 'MONITORING' | 'CLOSED';
export type EquipmentStatus = 'OK' | 'WATCH' | 'FAULT' | 'OUT OF SERVICE' | 'UNKNOWN';
export type WatchPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type MeshTransport = 'SIMULATED' | 'MESHTASTIC' | 'HTTP' | 'SERIAL';
export type MeshMode = 'SIMULATED' | 'BRIDGE';
export type LightningStatus = 'UNCHECKED' | 'CHECKED' | 'OBSCURED' | 'NO SMOKE' | 'POSSIBLE SMOKE' | 'CONFIRMED FIRE' | 'CLOSED';
export type DataFreshness = 'LIVE' | 'CACHED' | 'STALE' | 'UNAVAILABLE';
export type ProcedureCategory = 'OPENING' | 'CLOSING' | 'RADIO' | 'FIRE FINDER' | 'WEATHER' | 'LIGHTNING' | 'EMERGENCY' | 'FACILITY' | 'OTHER';

export interface Tower {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevationM: number;
  timezone: string;
  callsign?: string;
  meshtasticNodeId?: string;
  local?: boolean;
}

export interface Landmark {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'PEAK' | 'RIDGE' | 'ROAD' | 'WATER' | 'TOWER' | 'SETTLEMENT' | 'OTHER';
}


export interface HorizonPanorama {
  id: string;
  towerId: string;
  name: string;
  imageDataUrl?: string;
  startBearingDeg: number;
  spanDeg: number;
  createdAt: string;
  notes?: string;
}

export interface HorizonAnnotation {
  id: string;
  panoramaId: string;
  landmarkId?: string;
  name: string;
  bearingDeg: number;
  elevationAngleDeg?: number;
  notes?: string;
}

export interface LightningEvent {
  id: string;
  timestamp: string;
  lat: number;
  lon: number;
  amplitudeKa?: number;
  source: 'MANUAL' | 'IMPORTED' | 'REMOTE';
  clusterId?: string;
  status: LightningStatus;
  notes?: string;
}

export interface TerrainSample {
  id: string;
  lat: number;
  lon: number;
  elevationM: number;
  source: 'DEMO' | 'CSV' | 'GEOJSON' | 'ASCII GRID' | 'MANUAL';
}

export interface ObservationFlags {
  smokeVisible?: boolean;
  flameVisible?: boolean;
  growing?: boolean;
  column?: boolean;
  drifting?: boolean;
  intermittent?: boolean;
  obscured?: boolean;
  multiplePlumes?: boolean;
  lightningAssociated?: boolean;
  structureThreat?: boolean;
  roadThreat?: boolean;
  prescribedBurnPossible?: boolean;
  humanActivitySeen?: boolean;
  aircraftObserved?: boolean;
  locationTriangulated?: boolean;
  urgent?: boolean;
}

export interface Observation {
  id: string;
  reportId: string;
  createdAt: string;
  updatedAt: string;
  towerId: string;
  type: ObservationType;
  confidence: Confidence;
  urgency: Urgency;
  bearingDeg: number;
  bearingUncertaintyDeg?: number;
  verticalAngleDeg?: number;
  verticalAngleUncertaintyDeg?: number;
  rangeM?: number;
  rangeUncertaintyM?: number;
  targetLat?: number;
  targetLon?: number;
  targetMethod?: 'MANUAL' | 'BEARING/RANGE' | 'TRIANGULATION' | 'REMOTE REPORT' | 'FIELD CREW' | 'MAP SELECTION' | 'TERRAIN INTERSECTION';
  uncertaintyM?: number;
  smokeColor?: string;
  smokeDensity?: string;
  smokeShape?: string;
  notes?: string;
  flags: ObservationFlags;
  incidentId?: string;
  source: 'LOCAL' | 'REMOTE' | 'IMPORTED';
  weatherObservationId?: string;
}

export interface Bearing {
  id: string;
  reportId: string;
  incidentId?: string;
  towerId: string;
  bearingDeg: number;
  uncertaintyDeg: number;
  createdAt: string;
  source: 'LOCAL' | 'REMOTE' | 'MANUAL';
}

export interface TriangulationResidualRecord {
  bearingId: string;
  towerId: string;
  measuredDeg: number;
  predictedDeg: number;
  residualDeg: number;
  crossTrackM: number;
  normalizedResidual: number;
  outlier: boolean;
}

export interface Incident {
  id: string;
  reportId: string;
  title: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  targetLat?: number;
  targetLon?: number;
  uncertaintyM?: number;
  locationMethod?: 'MANUAL' | 'BEARING/RANGE' | 'TRIANGULATION' | 'REMOTE REPORT' | 'FIELD CREW' | 'TERRAIN INTERSECTION';
  confidence: Confidence;
  urgency: Urgency;
  observationIds: string[];
  bearingIds: string[];
  geometryQuality?: 'GOOD' | 'FAIR' | 'POOR';
  crossingAngleDeg?: number;
  rmsResidualDeg?: number;
  uncertaintyEllipse?: { majorM: number; minorM: number; bearingDeg: number };
  triangulationResiduals?: TriangulationResidualRecord[];
  triangulationUpdatedAt?: string;
}

export interface WatchItem {
  id: string;
  title: string;
  priority: WatchPriority;
  reason: string;
  dueAt?: string;
  targetBearing?: number;
  targetLat?: number;
  targetLon?: number;
  incidentId?: string;
  reportId?: string;
  status: 'OPEN' | 'DONE' | 'OBSCURED';
}

export interface WeatherObservation {
  id: string;
  timestamp: string;
  temperatureF?: number;
  rh?: number;
  windDir?: string;
  windMph?: number;
  gustMph?: number;
  pressureInHg?: number;
  precipIn?: number;
  visibilityMi?: number;
  cloudCover?: string;
  source: 'MANUAL' | 'TOWER SENSOR' | 'REMOTE STATION' | 'FORECAST';
  sourceName?: string;
  receivedAt?: string;
  stationId?: string;
  staleAfterMinutes?: number;
  notes?: string;
}

export interface WeatherSourceConfig {
  id: string;
  name: string;
  kind: 'LOCAL SENSOR' | 'REMOTE JSON';
  url: string;
  enabled: boolean;
  pollMinutes: number;
  staleAfterMinutes: number;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
}

export interface VisibilityObservation {
  id: string;
  timestamp: string;
  landmarkId: string;
  visible: boolean;
  distanceMi: number;
  notes?: string;
}

export interface ShiftRecord {
  id: string;
  towerId: string;
  operatorName: string;
  startedAt: string;
  endedAt?: string;
  status: 'ACTIVE' | 'CLOSED';
  handoffNotes?: string;
}

export interface Procedure {
  id: string;
  category: ProcedureCategory;
  title: string;
  steps: string[];
  notes?: string;
}

export interface ProcedureRun {
  id: string;
  procedureId: string;
  shiftId?: string;
  startedAt: string;
  completedAt?: string;
  completedSteps: number[];
  notes?: string;
}

export interface TowerContact {
  id: string;
  name: string;
  role: string;
  callsign?: string;
  phone?: string;
  radioChannel?: string;
  notes?: string;
}

export interface MaintenanceEntry {
  id: string;
  equipmentId: string;
  timestamp: string;
  kind: 'INSPECTION' | 'FAULT' | 'SERVICE' | 'NOTE';
  notes: string;
  statusAfter?: EquipmentStatus;
}

export interface GeneratedReport {
  id: string;
  type: 'INCIDENT' | 'SHIFT' | 'HANDOFF';
  title: string;
  generatedAt: string;
  incidentId?: string;
  shiftId?: string;
  snapshotJson: string;
  textBody: string;
}


export interface RadioLog {
  id: string;
  timestamp: string;
  station: string;
  direction: 'TO' | 'FROM';
  type: 'REPORT' | 'ACKNOWLEDGMENT' | 'REQUEST' | 'STATUS' | 'DISPATCH' | 'FIELD UPDATE' | 'OTHER';
  notes: string;
  incidentId?: string;
  channel?: string;
}

export interface ShiftLogEntry {
  id: string;
  timestamp: string;
  kind: string;
  message: string;
  incidentId?: string;
}

export interface Sector {
  id: string;
  startDeg: number;
  endDeg: number;
  lastScannedAt?: string;
  visibility?: string;
  notes?: string;
}

export interface Equipment {
  id: string;
  name: string;
  status: EquipmentStatus;
  notes?: string;
}

export type FWPMessageType = 'OBS' | 'UPDATE' | 'BEARING' | 'ACK' | 'CLEAR' | 'REQUEST' | 'STATUS';

export interface FWPMessage {
  id: string;
  version: 1;
  messageType: FWPMessageType;
  reportId: string;
  revision: number;
  timestamp: string;
  originNode: string;
  targetNode?: string;
  targetLat?: number;
  targetLon?: number;
  bearingDeg?: number;
  rangeM?: number;
  eventType?: ObservationType;
  confidence?: Confidence;
  urgency?: Urgency;
  flags?: number;
  transport: MeshTransport;
  payloadHex?: string;
  payloadBytes?: number;
  meshPacketId?: number;
  channel?: number;
  rxSnr?: number;
  rxRssi?: number;
  hopLimit?: number;
  deliveryState: 'QUEUED' | 'SENT' | 'DELIVERED' | 'DROPPED' | 'FAILED';
  humanAck?: boolean;
  error?: string;
}

export interface BridgeNode {
  id: string;
  nodeNum?: number;
  longName?: string;
  shortName?: string;
  lastHeard?: number;
  snr?: number;
}

export type BridgeState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RADIO_OFFLINE' | 'ERROR';

export interface AppSettings {
  id: 'settings';
  version: string;
  mode: 'OPERATE' | 'ANALYZE';
  activeTowerId: string;
  demoLoaded: boolean;
  onlineMapEnabled: boolean;
  heartbeatMinutes: 0 | 15 | 30 | 60;
  meshMode: MeshMode;
  bridgeUrl: string;
  fwpPortNum: number;
  viewshedEnabled: boolean;
  viewshedRangeM: number;
  activePanoramaId?: string;
  weatherAutoPoll: boolean;
  stationRole: StationRole;
  stationId: string;
  syncEnabled: boolean;
  syncServerUrl: string;
  syncIntervalSeconds: 30 | 60 | 120 | 300;
  sharePresence: boolean;
  fieldPositionMode: 'MANUAL' | 'DEVICE';
}


export type StationRole = 'LOOKOUT' | 'DISPATCH' | 'FIELD_CREW' | 'RANGER_STATION';
export type FieldUpdateType = 'ON_SCENE' | 'FIRE_LOCATED' | 'NO_FIRE_FOUND' | 'CORRECT_LOCATION' | 'STATUS' | 'NOTE';
export type SyncEntityType = 'INCIDENT' | 'OBSERVATION' | 'BEARING' | 'WATCH_ITEM' | 'RADIO_LOG' | 'SHIFT_LOG' | 'FIELD_UPDATE' | 'PRESENCE';

export interface FieldUpdate {
  id: string;
  incidentId: string;
  reportId: string;
  timestamp: string;
  stationId: string;
  stationName: string;
  role: StationRole;
  type: FieldUpdateType;
  notes?: string;
  lat?: number;
  lon?: number;
  accuracyM?: number;
  source: 'LOCAL' | 'REMOTE';
}

export interface StationPresence {
  id: string;
  stationId: string;
  stationName: string;
  role: StationRole;
  timestamp: string;
  lat?: number;
  lon?: number;
  activeIncidentId?: string;
  meshState?: string;
  internetState?: string;
}

export interface SyncConflict {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  detectedAt: string;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  remoteStationId: string;
  localJson: string;
  remoteJson: string;
  status: 'OPEN' | 'RESOLVED_LOCAL' | 'RESOLVED_REMOTE';
}

export interface SyncStatusRecord {
  id: 'sync';
  cursor: number;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  pushedRecords: number;
  pulledRecords: number;
  consecutiveFailures: number;
}
