import { useEffect, useMemo, useState } from 'react';
import type { Bearing, FWPMessage, Incident, Observation, Tower } from '../types';
import { db } from '../storage/db';
import { encodeFWP, flagsToWord } from '../protocol/fwp';
import { makeId } from '../utils/ids';
import { nowIso, fmtDateTime } from '../utils/time';
import { bearingBetween } from '../triangulation/geometry';
import { retriangulate } from './ingest';

export default function MeshPanel({messages,towers,observations,bearings,incidents,bridge}:{messages:FWPMessage[];towers:Tower[];observations:Observation[];bearings:Bearing[];incidents:Incident[];bridge:any}){
  const [selected,setSelected]=useState<string|undefined>(messages[0]?.id);
  const [dropNext,setDropNext]=useState(false);
  const [dupNext,setDupNext]=useState(false);
  const [targetNode,setTargetNode]=useState('^all');
  const [error,setError]=useState('');
  const [responseReportId,setResponseReportId]=useState('');
  const [responseBearing,setResponseBearing]=useState('');
  const [responseUncertainty,setResponseUncertainty]=useState('0.5');

  const msg=messages.find(m=>m.id===selected)||messages[0];
  const localTower=towers.find(t=>t.local)||towers[0];
  const openReport=observations.find(o=>(o.type==='SMOKE'||o.type==='FIRE') && o.source==='LOCAL') || observations.find(o=>o.type==='SMOKE'||o.type==='FIRE');
  const nodes=towers.map(t=>t.callsign||t.name);
  const snapshot=bridge?.snapshot;

  const requestMessages=useMemo(()=>messages.filter(m=>m.messageType==='REQUEST'&&m.transport==='MESHTASTIC').sort((a,b)=>b.timestamp.localeCompare(a.timestamp)),[messages]);
  const remoteReportIds=useMemo(()=>[...new Set([
    ...requestMessages.map(m=>m.reportId),
    ...observations.filter(o=>o.source==='REMOTE').map(o=>o.reportId),
  ])],[requestMessages,observations]);

  useEffect(()=>{
    if(!responseReportId&&remoteReportIds[0])setResponseReportId(remoteReportIds[0]);
  },[responseReportId,remoteReportIds]);

  useEffect(()=>{
    const client=bridge?.client; if(!client)return;
    return client.onEvent((event:any)=>{
      if(event.type==='delivery'&&event.clientMessageId){
        db.meshMessages.update(event.clientMessageId,{deliveryState:event.state,error:event.error,meshPacketId:event.packetId}).catch(console.error);
      }
    });
  },[bridge?.client]);

  function nextRevision(reportId:string){return Math.min(255,messages.filter(x=>x.reportId===reportId).length+1)}

  async function simulateBearing(){
    if(!openReport)return;
    const local=towers.find(t=>t.id===openReport.towerId); const remote=towers.find(t=>t.id!==openReport.towerId);
    if(!local||!remote)return;
    const targetLat=openReport.targetLat; const targetLon=openReport.targetLon;
    if(targetLat==null||targetLon==null){setError('The selected observation needs a range-derived or known target for simulation.');return;}
    const bearing=bearingBetween(remote,{lat:targetLat,lon:targetLon}); const timestamp=nowIso(); const inc=incidents.find(i=>i.reportId===openReport.reportId);
    const b:Bearing={id:makeId('bearing'),reportId:openReport.reportId,incidentId:inc?.id,towerId:remote.id,bearingDeg:Math.round(bearing*10)/10,uncertaintyDeg:0.5,createdAt:timestamp,source:'REMOTE'};
    const m:FWPMessage={id:makeId('mesh'),version:1,messageType:'BEARING',reportId:openReport.reportId,revision:nextRevision(openReport.reportId),timestamp,originNode:remote.meshtasticNodeId||remote.callsign||remote.name,bearingDeg:b.bearingDeg,transport:'SIMULATED',deliveryState:dropNext?'DROPPED':'DELIVERED'};
    const e=encodeFWP(m);m.payloadHex=e.hex;m.payloadBytes=e.bytes.length;
    await db.meshMessages.add(m); setSelected(m.id);
    if(dropNext){setDropNext(false);return;}
    const exists=(await db.bearings.where('reportId').equals(b.reportId).toArray()).find(x=>x.towerId===b.towerId);
    if(!exists)await db.bearings.add(b); else await db.bearings.update(exists.id,{bearingDeg:b.bearingDeg,createdAt:timestamp});
    await db.shiftLogs.add({id:makeId('log'),timestamp,kind:'MESH',message:`Remote bearing received from ${remote.name} (${b.bearingDeg.toFixed(1)}°)`,incidentId:inc?.id});
    await retriangulate(openReport.reportId);
    if(dupNext){const dupe={...m,id:makeId('mesh'),timestamp:new Date(Date.now()+20).toISOString()};await db.meshMessages.add(dupe);setDupNext(false);}
  }

  async function transmit(m:FWPMessage,target?:string){
    if(!bridge?.client||snapshot?.state!=='CONNECTED'||!snapshot?.radioConnected)throw new Error('Radio bridge is not connected to a Meshtastic node.');
    const enc=encodeFWP(m);m.payloadHex=enc.hex;m.payloadBytes=enc.bytes.length;
    await db.meshMessages.add(m);setSelected(m.id);
    bridge.client.sendFWP(m,enc.hex,{targetNode:target,wantAck:Boolean(target)});
    await db.meshMessages.update(m.id,{deliveryState:'SENT'});
  }

  async function sendObservation(){
    setError(''); if(!openReport)return;
    const target=targetNode==='^all'?undefined:targetNode;
    const m:FWPMessage={id:makeId('mesh'),version:1,messageType:'OBS',reportId:openReport.reportId,revision:nextRevision(openReport.reportId),timestamp:nowIso(),originNode:snapshot?.nodeId||localTower?.meshtasticNodeId||'LOCAL',targetNode:target,targetLat:openReport.targetLat,targetLon:openReport.targetLon,bearingDeg:openReport.bearingDeg,rangeM:openReport.rangeM,eventType:openReport.type,confidence:openReport.confidence,urgency:openReport.urgency,flags:flagsToWord(openReport.flags),transport:'MESHTASTIC',deliveryState:'QUEUED'};
    try{await transmit(m,target);await db.shiftLogs.add({id:makeId('log'),timestamp:m.timestamp,kind:'MESH',message:`Observation ${m.reportId} sent ${target?`to ${target}`:'as broadcast'}`});}
    catch(e){const text=e instanceof Error?e.message:String(e);await db.meshMessages.update(m.id,{deliveryState:'FAILED',error:text}).catch(()=>{});setError(text);}
  }

  async function requestBearing(){
    setError(''); if(!openReport)return;
    if(targetNode==='^all'){setError('Choose a specific remote node for a bearing request.');return;}
    const m:FWPMessage={id:makeId('mesh'),version:1,messageType:'REQUEST',reportId:openReport.reportId,revision:nextRevision(openReport.reportId),timestamp:nowIso(),originNode:snapshot?.nodeId||localTower?.meshtasticNodeId||'LOCAL',targetNode,targetLat:openReport.targetLat,targetLon:openReport.targetLon,eventType:openReport.type,confidence:openReport.confidence,urgency:'IMPORTANT',transport:'MESHTASTIC',deliveryState:'QUEUED'};
    try{await transmit(m,targetNode);await db.shiftLogs.add({id:makeId('log'),timestamp:m.timestamp,kind:'MESH',message:`Bearing request ${m.reportId} sent to ${targetNode}`});}
    catch(e){const text=e instanceof Error?e.message:String(e);await db.meshMessages.update(m.id,{deliveryState:'FAILED',error:text}).catch(()=>{});setError(text);}
  }

  async function sendBearingResponse(){
    setError('');
    const bearingDeg=Number(responseBearing); const uncertaintyDeg=Math.max(0.1,Number(responseUncertainty)||0.5);
    if(!responseReportId){setError('Choose a report to answer.');return;}
    if(!Number.isFinite(bearingDeg)||bearingDeg<0||bearingDeg>=360){setError('Enter a measured bearing from 0.0° to 359.9°.');return;}
    if(!localTower){setError('No local tower is configured.');return;}
    const request=requestMessages.find(r=>r.reportId===responseReportId);
    const destination=request?.originNode || (targetNode==='^all'?undefined:targetNode);
    if(!destination){setError('No requesting node is known. Select a directed destination.');return;}
    const remoteObservation=observations.find(o=>o.reportId===responseReportId);
    const incident=incidents.find(i=>i.reportId===responseReportId);
    const timestamp=nowIso();
    const existing=await db.bearings.where('reportId').equals(responseReportId).filter(b=>b.towerId===localTower.id).first();
    const bearingRecord:Bearing={id:existing?.id||makeId('bearing'),reportId:responseReportId,incidentId:incident?.id,towerId:localTower.id,bearingDeg:Math.round(bearingDeg*10)/10,uncertaintyDeg,createdAt:timestamp,source:'LOCAL'};
    if(existing)await db.bearings.put(bearingRecord);else await db.bearings.add(bearingRecord);
    const m:FWPMessage={id:makeId('mesh'),version:1,messageType:'BEARING',reportId:responseReportId,revision:nextRevision(responseReportId),timestamp,originNode:snapshot?.nodeId||localTower.meshtasticNodeId||localTower.callsign||localTower.name,targetNode:destination,targetLat:remoteObservation?.targetLat??incident?.targetLat,targetLon:remoteObservation?.targetLon??incident?.targetLon,bearingDeg:bearingRecord.bearingDeg,eventType:remoteObservation?.type,confidence:remoteObservation?.confidence,urgency:'IMPORTANT',transport:'MESHTASTIC',deliveryState:'QUEUED'};
    try{
      await transmit(m,destination);
      await db.shiftLogs.add({id:makeId('log'),timestamp,kind:'MESH',message:`Bearing response ${bearingRecord.bearingDeg.toFixed(1)}° for ${responseReportId} sent to ${destination}`,incidentId:incident?.id});
      await retriangulate(responseReportId);
      const watch=await db.watchItems.where('status').equals('OPEN').filter(w=>w.reportId===responseReportId&&w.reason.includes('Bearing request')).first();
      if(watch)await db.watchItems.update(watch.id,{status:'DONE'});
      setResponseBearing('');
    }catch(e){const text=e instanceof Error?e.message:String(e);await db.meshMessages.update(m.id,{deliveryState:'FAILED',error:text}).catch(()=>{});setError(text);}
  }

  async function ack(){if(!msg)return;await db.meshMessages.update(msg.id,{humanAck:true});await db.shiftLogs.add({id:makeId('log'),timestamp:nowIso(),kind:'MESH',message:`Operational acknowledgment recorded for ${msg.reportId}`});}

  const stats=useMemo(()=>({delivered:messages.filter(x=>x.deliveryState==='DELIVERED').length,dropped:messages.filter(x=>x.deliveryState==='DROPPED'||x.deliveryState==='FAILED').length}),[messages]);
  const remoteOptions=[...new Set([...(snapshot?.nodes||[]).map((n:any)=>n.id),...towers.filter(t=>!t.local).map(t=>t.meshtasticNodeId).filter(Boolean)])] as string[];

  return <div className="mesh-layout">
    <section className="panel">
      <div className="panel-header"><div><span className="section-kicker">FWP / MESHTASTIC · v0.3</span><h2>Radio transport</h2></div><span className={`mesh-state ${snapshot?.radioConnected?'ok':''}`}>● {snapshot?.radioConnected?`RADIO ${snapshot.nodeId||'CONNECTED'}`:'SIMULATOR READY'}</span></div>
      <div className="transport-columns">
        <div><span className="mini-label">SIMULATION</span><div className="node-strip">{nodes.map(n=><span key={n}>◉ {n}</span>)}<span>◉ Dispatch</span></div><div className="sim-controls"><button className="btn secondary" onClick={simulateBearing} disabled={!openReport}>Simulate remote bearing</button><label className="check"><input type="checkbox" checked={dropNext} onChange={e=>setDropNext(e.target.checked)}/> Drop next</label><label className="check"><input type="checkbox" checked={dupNext} onChange={e=>setDupNext(e.target.checked)}/> Duplicate next</label></div></div>
        <div><span className="mini-label">REAL RADIO BRIDGE</span><div className="bridge-readout"><strong>{snapshot?.state||'DISCONNECTED'}</strong><span>{snapshot?.radioConnected?'Meshtastic radio attached':'Configure bridge in TOWER → Network'}</span></div><label className="mesh-target"><span>Destination</span><select value={targetNode} onChange={e=>setTargetNode(e.target.value)}><option value="^all">Broadcast / ^all</option>{remoteOptions.map(n=><option key={n} value={n}>{n}</option>)}</select></label><div className="dual-actions"><button className="btn primary" disabled={!openReport} onClick={sendObservation}>Send observation</button><button className="btn secondary" disabled={!openReport} onClick={requestBearing}>Request bearing</button></div>
          <div className="bearing-response"><span className="mini-label">ANSWER REMOTE REQUEST</span>{remoteReportIds.length?<><label><span>Report</span><select value={responseReportId} onChange={e=>setResponseReportId(e.target.value)}>{remoteReportIds.map(id=><option key={id} value={id}>{id}</option>)}</select></label><div className="form-grid form-grid-2"><label><span>Measured bearing °</span><input inputMode="decimal" value={responseBearing} onChange={e=>setResponseBearing(e.target.value)} placeholder="121.7"/></label><label><span>± uncertainty °</span><input inputMode="decimal" value={responseUncertainty} onChange={e=>setResponseUncertainty(e.target.value)}/></label></div><button className="btn secondary wide" onClick={sendBearingResponse}>Send bearing response</button></>:<small>No remote observation or bearing request is waiting.</small>}</div>
          {error&&<div className="inline-error">{error}</div>}
        </div>
      </div>
      <div className="mesh-metrics"><div><strong>{messages.length}</strong><span>packets</span></div><div><strong>{stats.delivered}</strong><span>delivered</span></div><div><strong>{stats.dropped}</strong><span>failed/drop</span></div><div><strong>{bearings.length}</strong><span>bearings</span></div></div>
      <div className="packet-list">{messages.slice().sort((a,b)=>b.timestamp.localeCompare(a.timestamp)).map(m=><button key={m.id} className={selected===m.id?'selected':''} onClick={()=>setSelected(m.id)}><span>{m.messageType}</span><strong>{m.reportId}</strong><small>{m.originNode}</small><em>{m.payloadBytes||27} B · {m.transport}</em></button>)}</div>
    </section>
    <section className="panel packet-inspector"><span className="section-kicker">PACKET INSPECTOR</span><h2>{msg?`${msg.messageType} ${msg.reportId}`:'No packet selected'}</h2>{msg&&<><dl className="inspector-grid"><dt>Version</dt><dd>FWP/{msg.version}</dd><dt>Origin</dt><dd>{msg.originNode}</dd><dt>Revision</dt><dd>{msg.revision}</dd><dt>Time</dt><dd>{fmtDateTime(msg.timestamp)}</dd><dt>Transport</dt><dd>{msg.transport}</dd><dt>Delivery</dt><dd>{msg.deliveryState}</dd><dt>Packet ID</dt><dd>{msg.meshPacketId??'—'}</dd><dt>Bearing</dt><dd>{msg.bearingDeg!=null?`${msg.bearingDeg.toFixed(1)}°`:'—'}</dd><dt>Range</dt><dd>{msg.rangeM?`${(msg.rangeM/1000).toFixed(1)} km`:'—'}</dd><dt>SNR / RSSI</dt><dd>{msg.rxSnr!=null?`${msg.rxSnr} dB / ${msg.rxRssi??'—'} dBm`:'—'}</dd><dt>Human ACK</dt><dd>{msg.humanAck?'YES':'NO'}</dd></dl><div className="hex-box"><span>RAW PAYLOAD · {msg.payloadBytes||27} BYTES</span><code>{msg.payloadHex||'not encoded'}</code></div>{msg.error&&<div className="inline-error">{msg.error}</div>}<button className="btn secondary wide" onClick={ack}>Record operational ACK</button></>}</section>
  </div>;
}
