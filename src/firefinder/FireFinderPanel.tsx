import { useMemo, useState } from 'react';
import type { TerrainSample, Tower } from '../types';
import { bearingRangeCorridor, destinationPoint } from '../triangulation/geometry';
import { terrainIntersection } from '../terrain/terrain';

export interface FireFinderPlot {
  bearing: number;
  bearingUncertaintyDeg: number;
  rangeM: number;
  rangeUncertaintyM: number;
  lat: number;
  lon: number;
  vertical?: number;
  verticalUncertaintyDeg?: number;
  corridor: { lat: number; lon: number }[];
  terrainDerived?: boolean;
  terrainElevationM?: number;
}

export default function FireFinderPanel({ tower, terrainSamples=[], onPlot, onCreate }:{
  tower: Tower;
  terrainSamples?: TerrainSample[];
  onPlot: (v: FireFinderPlot) => void;
  onCreate?: (v: FireFinderPlot) => void;
}) {
  const [az, setAz] = useState('108.5');
  const [azUnc, setAzUnc] = useState('0.5');
  const [vertical, setVertical] = useState('-0.4');
  const [verticalUnc, setVerticalUnc] = useState('0.2');
  const [rangeMi, setRangeMi] = useState('10');
  const [rangeUncMi, setRangeUncMi] = useState('0.75');

  const result = useMemo(() => {
    const bearing = Number(az); const bearingUncertaintyDeg = Math.max(0.05, Number(azUnc) || 0.5); const verticalValue=Number(vertical);
    const enteredRangeM = Math.max(0, Number(rangeMi) || 0) * 1609.344; const rangeUncertaintyM = Math.max(0, Number(rangeUncMi) || 0) * 1609.344;
    if (!Number.isFinite(bearing) || bearing < 0 || bearing >= 360) return null;
    const terrain = enteredRangeM<=0 && Number.isFinite(verticalValue) ? terrainIntersection(tower,bearing,verticalValue,terrainSamples) : undefined;
    const rangeM=enteredRangeM||terrain?.distanceM||0;if(rangeM<=0)return null;const dest=terrain?{lat:terrain.lat,lon:terrain.lon}:destinationPoint(tower.lat,tower.lon,bearing,rangeM);
    return {bearing,bearingUncertaintyDeg,rangeM,rangeUncertaintyM:terrain?Math.max(250,rangeUncertaintyM):rangeUncertaintyM,lat:dest.lat,lon:dest.lon,vertical:Number.isFinite(verticalValue)?verticalValue:undefined,verticalUncertaintyDeg:Math.max(0,Number(verticalUnc)||0),corridor:bearingRangeCorridor(tower,bearing,bearingUncertaintyDeg,rangeM,terrain?Math.max(250,rangeUncertaintyM):rangeUncertaintyM),terrainDerived:Boolean(terrain),terrainElevationM:terrain?.elevationM};
  }, [az, azUnc, vertical, verticalUnc, rangeMi, rangeUncMi, tower, terrainSamples]);

  return <section className="instrument-panel"><div className="section-kicker">FIRE FINDER · v0.6</div><h2>Measured line of sight</h2><p className="instrument-help">Record the instrument reading and uncertainty. Leave range blank to let the offline terrain model attempt a vertical-angle intersection.</p>
    <div className="firefinder-readouts"><label><span>AZIMUTH</span><div className="big-input"><input inputMode="decimal" value={az} onChange={e=>setAz(e.target.value)}/><b>°</b></div></label><label><span>± BEARING</span><div className="big-input compact"><input inputMode="decimal" value={azUnc} onChange={e=>setAzUnc(e.target.value)}/><b>°</b></div></label><label><span>VERTICAL ANGLE</span><div className="big-input"><input inputMode="decimal" value={vertical} onChange={e=>setVertical(e.target.value)}/><b>°</b></div></label><label><span>± VERTICAL</span><div className="big-input compact"><input inputMode="decimal" value={verticalUnc} onChange={e=>setVerticalUnc(e.target.value)}/><b>°</b></div></label><label><span>ESTIMATED RANGE</span><div className="big-input"><input inputMode="decimal" value={rangeMi} onChange={e=>setRangeMi(e.target.value)} placeholder="blank = terrain"/><b>mi</b></div></label><label><span>± RANGE</span><div className="big-input compact"><input inputMode="decimal" value={rangeUncMi} onChange={e=>setRangeUncMi(e.target.value)}/><b>mi</b></div></label></div>
    {result && <div className="derived-box"><span>DERIVED ESTIMATE · {result.terrainDerived?'terrain intersection':'bearing/range projection'}</span><strong>{result.lat.toFixed(5)}, {result.lon.toFixed(5)}</strong><small>{result.terrainDerived?`Modeled terrain intersection at ${(result.rangeM/1609.344).toFixed(2)} mi${result.terrainElevationM!=null?` · ${Math.round(result.terrainElevationM)} m ground`:''}.`:`Search corridor: ±${result.bearingUncertaintyDeg.toFixed(1)}° · ±${(result.rangeUncertaintyM/1609.344).toFixed(2)} mi.`}</small></div>}
    <div className="dual-actions"><button className="btn secondary wide" disabled={!result} onClick={()=>result&&onPlot(result)}>Preview corridor</button>{onCreate&&<button className="btn primary wide" disabled={!result} onClick={()=>result&&onCreate(result)}>Create sighting</button>}</div>
  </section>
}
