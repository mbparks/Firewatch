import { useState } from 'react';
import Modal from '../components/Modal';
import { db } from '../storage/db';
import type { Confidence, Observation, ObservationType, Tower, Urgency } from '../types';
import { destinationPoint } from '../triangulation/geometry';
import { makeId, makeReportId } from '../utils/ids';
import { nowIso } from '../utils/time';

export default function SightingModal({tower,onClose,onSaved,initialBearing}:{tower:Tower;onClose:()=>void;onSaved?:(o:Observation)=>void;initialBearing?:number}) {
  const [bearing,setBearing]=useState(initialBearing!=null?initialBearing.toFixed(1):''); const [bearingUnc,setBearingUnc]=useState('0.5'); const [type,setType]=useState<ObservationType>('SMOKE'); const [confidence,setConfidence]=useState<Confidence>('MODERATE');
  const [urgency,setUrgency]=useState<Urgency>('IMPORTANT'); const [rangeMi,setRangeMi]=useState(''); const [rangeUncMi,setRangeUncMi]=useState(''); const [vertical,setVertical]=useState(''); const [verticalUnc,setVerticalUnc]=useState('0.2'); const [notes,setNotes]=useState('');
  const [smokeColor,setSmokeColor]=useState('Gray'); const [growing,setGrowing]=useState(false); const [column,setColumn]=useState(false); const [obscured,setObscured]=useState(false);
  const valid=Number.isFinite(Number(bearing))&&Number(bearing)>=0&&Number(bearing)<360;
  async function save(){
    if(!valid)return;
    const createdAt=nowIso(); const reportId=makeReportId(tower.callsign||tower.id); const currentWeather=await db.weather.orderBy('timestamp').reverse().first(); const rangeM=rangeMi?Number(rangeMi)*1609.344:undefined; const rangeUncertaintyM=rangeUncMi?Math.max(0,Number(rangeUncMi))*1609.344:undefined;
    const target=rangeM?destinationPoint(tower.lat,tower.lon,Number(bearing),rangeM):undefined;
    const obs:Observation={id:makeId('obs'),reportId,createdAt,updatedAt:createdAt,towerId:tower.id,type,confidence,urgency,bearingDeg:Number(bearing),bearingUncertaintyDeg:Math.max(0.05,Number(bearingUnc)||0.5),verticalAngleDeg:vertical?Number(vertical):undefined,verticalAngleUncertaintyDeg:vertical?Math.max(0,Number(verticalUnc)||0):undefined,rangeM,rangeUncertaintyM,targetLat:target?.lat,targetLon:target?.lon,targetMethod:target?'BEARING/RANGE':undefined,uncertaintyM:target?Math.max(150,rangeUncertaintyM||rangeM!*0.08):undefined,smokeColor,notes,flags:{smokeVisible:type==='SMOKE'||type==='FIRE',flameVisible:type==='FLAME'||type==='FIRE',growing,column,obscured,urgent:urgency==='EMERGENCY'},source:'LOCAL',weatherObservationId:currentWeather?.id};
    const bearingRow={id:makeId('bearing'),reportId,towerId:tower.id,bearingDeg:obs.bearingDeg,uncertaintyDeg:obs.bearingUncertaintyDeg||0.5,createdAt,source:'LOCAL' as const};
    await db.transaction('rw',[db.observations,db.bearings,db.shiftLogs],async()=>{
      await db.observations.add(obs); await db.bearings.add(bearingRow);
      await db.shiftLogs.add({id:makeId('log'),timestamp:createdAt,kind:'OBSERVATION',message:`${type} observed at ${obs.bearingDeg.toFixed(1)}° ±${bearingRow.uncertaintyDeg.toFixed(1)}° — report ${reportId}`});
    });
    onSaved?.(obs); onClose();
  }
  return <Modal title="New sighting" onClose={onClose} wide>
    <div className="capture-banner"><strong>CAPTURE NOW</strong><span>Refine later. Bearing, type, and confidence are enough to save.</span></div>
    <div className="form-grid form-grid-3">
      <label><span>Bearing / azimuth</span><div className="input-suffix"><input autoFocus inputMode="decimal" value={bearing} onChange={e=>setBearing(e.target.value)} placeholder="247.3"/><b>°</b></div></label><label><span>Bearing uncertainty</span><div className="input-suffix"><input inputMode="decimal" value={bearingUnc} onChange={e=>setBearingUnc(e.target.value)}/><b>±°</b></div></label>
      <label><span>Observation type</span><select value={type} onChange={e=>setType(e.target.value as ObservationType)}>{['UNKNOWN','SMOKE','FIRE','FLAME','LIGHTNING','PRESCRIBED BURN','STRUCTURE FIRE','FALSE ALARM','CLEAR','OTHER'].map(x=><option key={x}>{x}</option>)}</select></label>
      <label><span>Confidence</span><select value={confidence} onChange={e=>setConfidence(e.target.value as Confidence)}>{['UNKNOWN','LOW','MODERATE','HIGH','CONFIRMED'].map(x=><option key={x}>{x}</option>)}</select></label>
      <label><span>Estimated range</span><div className="input-suffix"><input inputMode="decimal" value={rangeMi} onChange={e=>setRangeMi(e.target.value)} placeholder="optional"/><b>mi</b></div></label><label><span>Range uncertainty</span><div className="input-suffix"><input inputMode="decimal" value={rangeUncMi} onChange={e=>setRangeUncMi(e.target.value)} placeholder="optional"/><b>±mi</b></div></label>
      <label><span>Vertical angle</span><div className="input-suffix"><input inputMode="decimal" value={vertical} onChange={e=>setVertical(e.target.value)} placeholder="optional"/><b>°</b></div></label><label><span>Vertical uncertainty</span><div className="input-suffix"><input inputMode="decimal" value={verticalUnc} onChange={e=>setVerticalUnc(e.target.value)} placeholder="0.2"/><b>±°</b></div></label>
      <label><span>Urgency</span><select value={urgency} onChange={e=>setUrgency(e.target.value as Urgency)}>{['ROUTINE','IMPORTANT','EMERGENCY'].map(x=><option key={x}>{x}</option>)}</select></label>
      <label><span>Smoke color</span><select value={smokeColor} onChange={e=>setSmokeColor(e.target.value)}><option>White</option><option>Gray</option><option>Dark gray</option><option>Black</option><option>Brown</option><option>Unknown</option></select></label>
      <div className="flag-field"><span>Observed flags</span><label className="check"><input type="checkbox" checked={growing} onChange={e=>setGrowing(e.target.checked)}/> Growing</label><label className="check"><input type="checkbox" checked={column} onChange={e=>setColumn(e.target.checked)}/> Column</label><label className="check"><input type="checkbox" checked={obscured} onChange={e=>setObscured(e.target.checked)}/> Obscured</label></div>
      <label className="span-3"><span>Notes</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What do you see? Keep it brief." rows={3}/></label>
    </div>
    <div className="modal-actions"><button className="btn secondary" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!valid} onClick={save}>Record sighting</button></div>
  </Modal>
}
