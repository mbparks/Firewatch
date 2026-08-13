import { useMemo, useState } from 'react';
import Badge from '../components/Badge';
import { db } from '../storage/db';
import { useTable } from '../hooks';
import type { Incident, ShiftRecord, Tower } from '../types';
import { makeId } from '../utils/ids';
import { fmtDateTime } from '../utils/time';
import { buildHandoffReport, buildIncidentReport, buildShiftReport, type BuiltReport } from './builders';
import { downloadBlob, reportPdfBlob } from './pdf';

type Props={tower:Tower;networkOnline:boolean;meshState:string};
function slug(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)}
function downloadJson(data:unknown,name:string){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
export default function ReportsWorkspace({tower,networkOnline,meshState}:Props){
  const incidents=useTable(db.incidents,'updatedAt'),shifts=useTable(db.shifts,'startedAt'),reports=useTable(db.reports,'generatedAt');
  const [incidentId,setIncidentId]=useState(''),[busy,setBusy]=useState('');
  const selected=useMemo(()=>incidents.find(i=>i.id===incidentId)||incidents[0],[incidents,incidentId]);const shift=shifts.find(s=>s.status==='ACTIVE')||shifts[0];
  async function emit(type:'INCIDENT'|'SHIFT'|'HANDOFF',format:'PDF'|'JSON'){
    setBusy(`${type}-${format}`);try{let built:BuiltReport;if(type==='INCIDENT'){if(!selected)return;built=await buildIncidentReport(selected,tower)}else if(type==='SHIFT'){if(!shift)return;built=await buildShiftReport(shift,tower)}else built=await buildHandoffReport(shift,tower,{online:networkOnline,mesh:meshState});const reportId=makeId('report');await db.reports.add({id:reportId,type,title:built.title,generatedAt:new Date().toISOString(),incidentId:built.incidentId,shiftId:built.shiftId,snapshotJson:JSON.stringify(built.snapshot),textBody:built.textBody});await db.shiftLogs.add({id:makeId('log'),timestamp:new Date().toISOString(),kind:'REPORT',message:`Generated ${type.toLowerCase()} report`});const base=`firewatch-${type.toLowerCase()}-${slug(type==='INCIDENT'?(selected?.reportId||'report'):type==='SHIFT'?(shift?.operatorName||'shift'):tower.name)}`;if(format==='PDF')downloadBlob(reportPdfBlob(built.title,built.textBody),`${base}.pdf`);else downloadJson(built.snapshot,`${base}.json`)}finally{setBusy('')}}
  async function redownload(id:string){const r=await db.reports.get(id);if(!r)return;downloadBlob(reportPdfBlob(r.title,r.textBody),`firewatch-${r.type.toLowerCase()}-${slug(r.title)}.pdf`)}
  return <div className="reports-workspace"><div className="panel-header"><div><span className="section-kicker">REPORTS · v1.0</span><h2>Evidence and handoff packages</h2></div><Badge tone="info">{reports.length} generated</Badge></div>
    <div className="report-grid">
      <section className="report-card"><span className="section-kicker">INCIDENT</span><h3>Incident report</h3><p>Location, uncertainty, observations, bearing evidence, attached weather, communications, FWP traffic, and timeline.</p><select value={selected?.id||''} onChange={e=>setIncidentId(e.target.value)}>{incidents.map((i:Incident)=><option key={i.id} value={i.id}>{i.reportId} · {i.title}</option>)}</select><div className="dual-actions"><button className="btn primary" disabled={!selected||!!busy} onClick={()=>emit('INCIDENT','PDF')}>Export PDF</button><button className="btn secondary" disabled={!selected||!!busy} onClick={()=>emit('INCIDENT','JSON')}>Export JSON</button></div></section>
      <section className="report-card"><span className="section-kicker">SHIFT</span><h3>Shift report</h3><p>{shift?`${shift.operatorName} · ${shift.status}`:'No shift record yet.'}</p><div className="dual-actions"><button className="btn primary" disabled={!shift||!!busy} onClick={()=>emit('SHIFT','PDF')}>Export PDF</button><button className="btn secondary" disabled={!shift||!!busy} onClick={()=>emit('SHIFT','JSON')}>Export JSON</button></div></section>
      <section className="report-card"><span className="section-kicker">HANDOFF</span><h3>Operational handoff</h3><p>Active incidents, unresolved rechecks, lightning watches, degraded equipment, communications state, latest weather, and operator notes.</p><div className="dual-actions"><button className="btn primary" disabled={!!busy} onClick={()=>emit('HANDOFF','PDF')}>Export PDF</button><button className="btn secondary" disabled={!!busy} onClick={()=>emit('HANDOFF','JSON')}>Export JSON</button></div></section>
    </div>
    <section className="instrument-section"><span className="section-kicker">REPORT HISTORY</span><div className="report-history">{reports.slice(0,20).map(r=><div key={r.id}><div><strong>{r.title}</strong><small>{fmtDateTime(r.generatedAt)} · {r.type}</small></div><button className="btn ghost" onClick={()=>redownload(r.id)}>PDF again</button></div>)}</div></section>
    <div className="analysis-note">PDF export is generated locally in the browser with no cloud service. Generated-report snapshots are retained in IndexedDB and included in station backups.</div>
  </div>
}
