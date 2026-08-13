import { useMemo, useState } from 'react';
import type { HorizonAnnotation, HorizonPanorama, Landmark, Tower } from '../types';
import { bearingBetween, haversineM } from '../triangulation/geometry';
import { db } from '../storage/db';
import { makeId } from '../utils/ids';
import { nowIso } from '../utils/time';

function signedDelta(a:number,b:number){return (((a-b)+540)%360)-180}

export default function HorizonPanel({tower,landmarks,panoramas,annotations,onSmokeHere}:{tower:Tower;landmarks:Landmark[];panoramas:HorizonPanorama[];annotations:HorizonAnnotation[];onSmokeHere:(bearing:number)=>void}){
  const [center,setCenter]=useState(0);const [name,setName]=useState('');const [manualBearing,setManualBearing]=useState('');const [selectedId,setSelectedId]=useState(panoramas.find(p=>p.towerId===tower.id)?.id||'');
  const pano=panoramas.find(p=>p.id===selectedId)||panoramas.find(p=>p.towerId===tower.id);
  const anns=annotations.filter(a=>a.panoramaId===pano?.id);
  const visible=useMemo(()=>landmarks.map(l=>({l,bearing:bearingBetween(tower,l),distanceM:haversineM(tower,l)})).filter(x=>Math.abs(signedDelta(x.bearing,center))<=50),[landmarks,tower,center]);
  async function ensurePanorama(file?:File){
    let id=pano?.id;if(!id){id=makeId('pano');await db.panoramas.add({id,towerId:tower.id,name:'Primary horizon',startBearingDeg:0,spanDeg:360,createdAt:nowIso()});setSelectedId(id)}
    if(file){const reader=new FileReader();reader.onload=async()=>{await db.panoramas.update(id!,{imageDataUrl:String(reader.result)});};reader.readAsDataURL(file)}
    return id;
  }
  async function addAnnotation(){if(!name.trim())return;const pid=await ensurePanorama();const bearing=manualBearing!==''?Number(manualBearing):center;if(!pid||!Number.isFinite(bearing))return;await db.horizonAnnotations.add({id:makeId('ann'),panoramaId:pid,name:name.trim(),bearingDeg:(bearing+360)%360});setName('');setManualBearing('')}
  return <section className="instrument-panel horizon-panel">
    <div className="section-kicker">HORIZON · v0.4</div><h2>Calibrated tower panorama</h2><p className="instrument-help">Rotate the bearing window to match the real horizon. Landmarks are computed from station coordinates; manual annotations remain separate calibration evidence.</p>
    <div className="horizon-toolbar"><label className="btn secondary file-btn">{pano?.imageDataUrl?'Replace panorama image':'Load panorama image'}<input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&ensurePanorama(e.target.files[0])}/></label><button className="btn primary" onClick={()=>onSmokeHere(center)}>Smoke here · {center.toFixed(0)}°</button></div>
    <div className="horizon-window" style={pano?.imageDataUrl?{backgroundImage:`linear-gradient(rgba(5,12,9,.12),rgba(5,12,9,.45)),url(${pano.imageDataUrl})`,backgroundPosition:`${((((center-(pano.startBearingDeg||0))+360)%360)/(pano.spanDeg||360))*100}% center`}:undefined}>
      <div className="horizon-centerline"/><div className="horizon-bearing">{center.toFixed(0)}°</div>
      {visible.map(({l,bearing,distanceM})=>{const x=50+signedDelta(bearing,center)/100*100;return <div className="horizon-label" key={l.id} style={{left:`${x}%`}}><i/><strong>{l.name}</strong><span>{bearing.toFixed(0)}° · {(distanceM/1609.344).toFixed(1)} mi</span></div>})}
      {anns.filter(a=>Math.abs(signedDelta(a.bearingDeg,center))<=50).map(a=>{const x=50+signedDelta(a.bearingDeg,center);return <div className="horizon-label manual" key={a.id} style={{left:`${x}%`}}><i/><strong>{a.name}</strong><span>{a.bearingDeg.toFixed(1)}°</span></div>})}
    </div>
    <input className="horizon-slider" type="range" min="0" max="359" step="1" value={center} onChange={e=>setCenter(Number(e.target.value))}/>
    <div className="horizon-card-grid"><div><span className="mini-label">PANORAMA CALIBRATION</span>{pano?<><label className="cal-field"><span>Image starts at bearing</span><div className="input-suffix"><input value={pano.startBearingDeg} onChange={e=>db.panoramas.update(pano.id,{startBearingDeg:Number(e.target.value)||0})}/><b>°</b></div></label><label className="cal-field"><span>Image angular span</span><div className="input-suffix"><input value={pano.spanDeg} onChange={e=>db.panoramas.update(pano.id,{spanDeg:Math.max(1,Math.min(360,Number(e.target.value)||360))})}/><b>°</b></div></label></>:<small>Load an image to create a calibrated panorama record.</small>}<span className="mini-label landmark-subhead">LANDMARKS IN VIEW</span>{visible.length?visible.slice(0,7).map(x=><div className="fact-row" key={x.l.id}><span>{x.l.name}</span><strong>{x.bearing.toFixed(1)}°</strong></div>):<small>No registered landmarks in ±50° window.</small>}</div><div><span className="mini-label">ADD MANUAL HORIZON MARK</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ridge notch / road cut"/><div className="input-suffix"><input value={manualBearing} onChange={e=>setManualBearing(e.target.value)} placeholder={center.toFixed(0)}/><b>°</b></div><button className="btn secondary wide" onClick={addAnnotation}>Add annotation</button></div></div>
  </section>
}
