import type { Bearing, Tower } from '../types';

const R = 6371000;
const toRad = (deg: number) => deg * Math.PI / 180;
const toDeg = (rad: number) => rad * 180 / Math.PI;

export type GeoPoint = { lat: number; lon: number };

export interface BearingResidual {
  bearingId: string;
  towerId: string;
  measuredDeg: number;
  predictedDeg: number;
  residualDeg: number;
  crossTrackM: number;
  normalizedResidual: number;
  outlier: boolean;
}

export interface UncertaintyEllipse {
  majorM: number;
  minorM: number;
  bearingDeg: number;
}

export interface TriangulationResult extends GeoPoint {
  uncertaintyM: number;
  geometryQuality: 'GOOD' | 'FAIR' | 'POOR';
  crossingAngle?: number;
  rmsResidualDeg: number;
  maxResidualDeg: number;
  ellipse: UncertaintyEllipse;
  residuals: BearingResidual[];
  contributingBearingIds: string[];
}

export function destinationPoint(lat: number, lon: number, bearingDeg: number, distanceM: number): GeoPoint {
  const δ = distanceM / R;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);
  const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);
  return { lat: toDeg(φ2), lon: ((toDeg(λ2) + 540) % 360) - 180 };
}

export function haversineM(a: GeoPoint, b: GeoPoint) {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const dφ = toRad(b.lat - a.lat), dλ = toRad(b.lon - a.lon);
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearingBetween(a: GeoPoint, b: GeoPoint) {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat), λ1 = toRad(a.lon), λ2 = toRad(b.lon);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function angleDeltaDeg(a: number, b: number) {
  return (((a - b) + 540) % 360) - 180;
}

function localXY(lat: number, lon: number, origin: GeoPoint) {
  const x = toRad(lon - origin.lon) * R * Math.cos(toRad(origin.lat));
  const y = toRad(lat - origin.lat) * R;
  return { x, y };
}

function xyToLatLon(x: number, y: number, origin: GeoPoint): GeoPoint {
  return { lat: origin.lat + toDeg(y / R), lon: origin.lon + toDeg(x / (R * Math.cos(toRad(origin.lat)))) };
}

function qualityFromAngles(angles: number[], rmsResidualDeg: number): 'GOOD' | 'FAIR' | 'POOR' {
  let best = 0;
  for (let i = 0; i < angles.length; i++) {
    for (let j = i + 1; j < angles.length; j++) {
      const d = Math.abs(angleDeltaDeg(angles[i], angles[j]));
      const acute = d > 90 ? 180 - d : d;
      best = Math.max(best, acute);
    }
  }
  if (best >= 45 && rmsResidualDeg <= 1.25) return 'GOOD';
  if (best >= 20 && rmsResidualDeg <= 3) return 'FAIR';
  return 'POOR';
}

export function intersectBearings(t1: Tower, b1: number, t2: Tower, b2: number): TriangulationResult | null {
  const bA: Bearing = { id: 'b1', reportId: '', towerId: t1.id, bearingDeg: b1, uncertaintyDeg: 0.5, createdAt: '', source: 'MANUAL' };
  const bB: Bearing = { id: 'b2', reportId: '', towerId: t2.id, bearingDeg: b2, uncertaintyDeg: 0.5, createdAt: '', source: 'MANUAL' };
  const result = triangulateBearings([bA, bB], [t1, t2]);
  if (!result) return null;
  const crossingAngle = Math.abs(angleDeltaDeg(b1, b2));
  return { ...result, crossingAngle };
}

/** Weighted least-squares line intersection. Bearings remain evidence; no measurement is silently removed. */
export function triangulateBearings(bearings: Bearing[], towers: Tower[]): TriangulationResult | null {
  const inputs = bearings
    .map(b => ({ b, tower: towers.find(t => t.id === b.towerId) }))
    .filter((x): x is { b: Bearing; tower: Tower } => Boolean(x.tower));
  if (inputs.length < 2) return null;

  const origin: GeoPoint = {
    lat: inputs.reduce((s, x) => s + x.tower.lat, 0) / inputs.length,
    lon: inputs.reduce((s, x) => s + x.tower.lon, 0) / inputs.length,
  };

  // Minimize sum w_i (n_i · (x - p_i))^2, where n is normal to bearing line.
  let a00 = 0, a01 = 0, a11 = 0, c0 = 0, c1 = 0;
  for (const { b, tower } of inputs) {
    const p = localXY(tower.lat, tower.lon, origin);
    const θ = toRad(b.bearingDeg);
    const nx = Math.cos(θ);
    const ny = -Math.sin(θ);
    const sigma = Math.max(0.1, b.uncertaintyDeg || 0.5);
    const w = 1 / (sigma * sigma);
    a00 += w * nx * nx;
    a01 += w * nx * ny;
    a11 += w * ny * ny;
    const np = nx * p.x + ny * p.y;
    c0 += w * nx * np;
    c1 += w * ny * np;
  }
  const det = a00 * a11 - a01 * a01;
  if (Math.abs(det) < 1e-10) return null;
  const x = (c0 * a11 - c1 * a01) / det;
  const y = (a00 * c1 - a01 * c0) / det;
  const point = xyToLatLon(x, y, origin);

  const residuals: BearingResidual[] = inputs.map(({ b, tower }) => {
    const predictedDeg = bearingBetween(tower, point);
    const residualDeg = angleDeltaDeg(b.bearingDeg, predictedDeg);
    const distanceM = haversineM(tower, point);
    const crossTrackM = Math.sin(toRad(residualDeg)) * distanceM;
    const normalizedResidual = Math.abs(residualDeg) / Math.max(0.1, b.uncertaintyDeg || 0.5);
    return {
      bearingId: b.id,
      towerId: tower.id,
      measuredDeg: b.bearingDeg,
      predictedDeg,
      residualDeg,
      crossTrackM,
      normalizedResidual,
      outlier: normalizedResidual > 3,
    };
  });

  const rmsResidualDeg = Math.sqrt(residuals.reduce((s, r) => s + r.residualDeg ** 2, 0) / residuals.length);
  const maxResidualDeg = Math.max(...residuals.map(r => Math.abs(r.residualDeg)));
  const geometryQuality = qualityFromAngles(inputs.map(x => x.b.bearingDeg), rmsResidualDeg);

  // Inverse normal matrix gives relative geometry ellipse. Scale with observed angular uncertainty and range.
  const inv00 = a11 / det;
  const inv01 = -a01 / det;
  const inv11 = a00 / det;
  const trace = inv00 + inv11;
  const disc = Math.sqrt(Math.max(0, ((inv00 - inv11) / 2) ** 2 + inv01 ** 2));
  const λ1 = Math.max(1e-9, trace / 2 + disc);
  const λ2 = Math.max(1e-9, trace / 2 - disc);
  const avgRange = inputs.reduce((s, x) => s + haversineM(x.tower, point), 0) / inputs.length;
  const avgSigmaRad = inputs.reduce((s, x) => s + toRad(Math.max(0.1, x.b.uncertaintyDeg || 0.5)), 0) / inputs.length;
  const baseScale = Math.max(30, avgRange * avgSigmaRad);
  const normalize = Math.sqrt(Math.max(λ1, 1e-9));
  const majorM = Math.max(40, baseScale * Math.sqrt(λ1) / normalize * (geometryQuality === 'POOR' ? 2 : geometryQuality === 'FAIR' ? 1.35 : 1));
  const minorM = Math.max(25, baseScale * Math.sqrt(λ2) / normalize);
  const ellipseBearing = (toDeg(0.5 * Math.atan2(2 * inv01, inv00 - inv11)) + 360) % 180;
  const residualPenalty = Math.max(1, rmsResidualDeg / Math.max(0.5, inputs.reduce((s, x) => s + x.b.uncertaintyDeg, 0) / inputs.length));
  const uncertaintyM = Math.round(majorM * residualPenalty);

  return {
    ...point,
    uncertaintyM,
    geometryQuality,
    rmsResidualDeg,
    maxResidualDeg,
    ellipse: { majorM: Math.round(majorM * residualPenalty), minorM: Math.round(minorM * residualPenalty), bearingDeg: ellipseBearing },
    residuals,
    contributingBearingIds: inputs.map(x => x.b.id),
  };
}

export function bearingRangeCorridor(tower: GeoPoint, bearingDeg: number, bearingUncertaintyDeg: number, rangeM: number, rangeUncertaintyM: number) {
  const near = Math.max(0, rangeM - Math.max(0, rangeUncertaintyM));
  const far = rangeM + Math.max(0, rangeUncertaintyM);
  const left = bearingDeg - Math.max(0.05, bearingUncertaintyDeg);
  const right = bearingDeg + Math.max(0.05, bearingUncertaintyDeg);
  return [
    destinationPoint(tower.lat, tower.lon, left, near),
    destinationPoint(tower.lat, tower.lon, left, far),
    destinationPoint(tower.lat, tower.lon, right, far),
    destinationPoint(tower.lat, tower.lon, right, near),
    destinationPoint(tower.lat, tower.lon, left, near),
  ];
}

export function ellipsePolygon(center: GeoPoint, ellipse: UncertaintyEllipse, points = 48) {
  const result: GeoPoint[] = [];
  const θ = toRad(ellipse.bearingDeg);
  for (let i = 0; i <= points; i++) {
    const a = i / points * Math.PI * 2;
    const ux = ellipse.majorM * Math.cos(a);
    const uy = ellipse.minorM * Math.sin(a);
    const x = ux * Math.sin(θ) + uy * Math.cos(θ);
    const y = ux * Math.cos(θ) - uy * Math.sin(θ);
    const distance = Math.sqrt(x * x + y * y);
    const bearing = (toDeg(Math.atan2(x, y)) + 360) % 360;
    result.push(destinationPoint(center.lat, center.lon, bearing, distance));
  }
  return result;
}
