import type { LightningEvent } from '../types';
import { haversineM } from '../triangulation/geometry';

export interface LightningCluster{ id:string; events:LightningEvent[]; lat:number;lon:number;firstAt:string;lastAt:string; }
export function clusterLightning(events:LightningEvent[],distanceM=5000,timeWindowMs=90*60000):LightningCluster[]{
  const clusters:LightningCluster[]=[];
  for(const e of [...events].sort((a,b)=>+new Date(a.timestamp)-+new Date(b.timestamp))){
    let found=clusters.find(c=>Math.abs(+new Date(e.timestamp)-+new Date(c.lastAt))<=timeWindowMs&&haversineM({lat:e.lat,lon:e.lon},{lat:c.lat,lon:c.lon})<=distanceM);
    if(!found){found={id:e.clusterId||`cluster-${clusters.length+1}`,events:[],lat:e.lat,lon:e.lon,firstAt:e.timestamp,lastAt:e.timestamp};clusters.push(found)}
    found.events.push(e);found.lat=found.events.reduce((s,x)=>s+x.lat,0)/found.events.length;found.lon=found.events.reduce((s,x)=>s+x.lon,0)/found.events.length;found.firstAt=found.events[0].timestamp;found.lastAt=e.timestamp;
  }
  return clusters;
}

export function parseLightningCsv(text:string):Omit<LightningEvent,'id'>[]{
  const lines=text.trim().split(/\r?\n/).filter(Boolean);if(lines.length<2)return[];const headers=lines[0].split(',').map(x=>x.trim().toLowerCase());
  const idx=(...names:string[])=>headers.findIndex(h=>names.includes(h));const ilat=idx('lat','latitude'),ilon=idx('lon','lng','longitude'),itime=idx('timestamp','time','datetime'),iamp=idx('amplitude','amplitudeka','ka');
  if(ilat<0||ilon<0)throw new Error('CSV needs lat/latitude and lon/longitude columns');
  return lines.slice(1).map(line=>{const c=line.split(',').map(x=>x.trim());const lat=Number(c[ilat]),lon=Number(c[ilon]);if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;return{timestamp:itime>=0&&c[itime]?new Date(c[itime]).toISOString():new Date().toISOString(),lat,lon,amplitudeKa:iamp>=0&&c[iamp]?Number(c[iamp]):undefined,source:'IMPORTED' as const,status:'UNCHECKED' as const}}).filter(Boolean) as Omit<LightningEvent,'id'>[];
}
