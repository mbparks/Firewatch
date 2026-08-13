import type { TerrainSample, Tower } from '../types';
import { bearingBetween, destinationPoint, haversineM, type GeoPoint } from '../triangulation/geometry';

const EARTH_R = 6371000;
const rad=(d:number)=>d*Math.PI/180;
const deg=(r:number)=>r*180/Math.PI;

export function sampleElevation(samples:TerrainSample[], point:GeoPoint, maxNeighbors=8):number|undefined{
  if(!samples.length)return undefined;
  const nearest=samples.map(s=>({s,d:haversineM(s,point)})).sort((a,b)=>a.d-b.d).slice(0,maxNeighbors);
  if(!nearest.length||nearest[0].d>25000)return undefined;
  if(nearest[0].d<2)return nearest[0].s.elevationM;
  let w=0,z=0;
  for(const n of nearest){const wi=1/Math.max(25,n.d*n.d);w+=wi;z+=wi*n.s.elevationM}
  return w?z/w:undefined;
}

function apparentAngleDeg(observerElevationM:number, terrainElevationM:number, distanceM:number){
  if(distanceM<=0)return 90;
  const curvatureDrop=distanceM*distanceM/(2*EARTH_R);
  return deg(Math.atan2(terrainElevationM-observerElevationM-curvatureDrop,distanceM));
}

export interface LineOfSightResult{
  visible:boolean;
  targetElevationM?:number;
  targetAngleDeg?:number;
  obstruction?:{lat:number;lon:number;distanceM:number;elevationM:number;angleDeg:number};
  clearanceDeg?:number;
  bearingDeg:number;
  distanceM:number;
  modeled:boolean;
}

export function lineOfSight(tower:Tower,target:GeoPoint,samples:TerrainSample[],steps=80):LineOfSightResult{
  const distanceM=haversineM(tower,target);const bearingDeg=bearingBetween(tower,target);const observer=tower.elevationM+2;
  const targetElevationM=sampleElevation(samples,target);
  const targetAngleDeg=targetElevationM==null?undefined:apparentAngleDeg(observer,targetElevationM,distanceM);
  if(targetElevationM==null)return {visible:false,bearingDeg,distanceM,modeled:false};
  let maxAngle=-90;let obstruction:LineOfSightResult['obstruction'];
  for(let i=1;i<steps;i++){
    const d=distanceM*i/steps;const p=destinationPoint(tower.lat,tower.lon,bearingDeg,d);const z=sampleElevation(samples,p);if(z==null)continue;
    const a=apparentAngleDeg(observer,z,d);
    if(a>maxAngle){maxAngle=a;obstruction={...p,distanceM:d,elevationM:z,angleDeg:a}}
  }
  const clearanceDeg=(targetAngleDeg as number)-maxAngle;const visible=clearanceDeg>=-0.05;
  return {visible,targetElevationM,targetAngleDeg,obstruction:visible?undefined:obstruction,clearanceDeg,bearingDeg,distanceM,modeled:true};
}

export interface TerrainIntersection{
  lat:number;lon:number;distanceM:number;elevationM:number;terrainAngleDeg:number;deltaDeg:number;
}

export function terrainIntersection(tower:Tower,bearingDeg:number,verticalAngleDeg:number,samples:TerrainSample[],maxRangeM=50000,stepM=200):TerrainIntersection|undefined{
  if(!samples.length)return undefined;const observer=tower.elevationM+2;let best:TerrainIntersection|undefined;let prevDelta:number|undefined;
  for(let d=Math.max(200,stepM);d<=maxRangeM;d+=stepM){
    const p=destinationPoint(tower.lat,tower.lon,bearingDeg,d);const z=sampleElevation(samples,p);if(z==null)continue;
    const terrainAngleDeg=apparentAngleDeg(observer,z,d);const deltaDeg=terrainAngleDeg-verticalAngleDeg;
    const rec={...p,distanceM:d,elevationM:z,terrainAngleDeg,deltaDeg:Math.abs(deltaDeg)};
    if(!best||rec.deltaDeg<best.deltaDeg)best=rec;
    if(prevDelta!=null&&Math.sign(prevDelta)!==Math.sign(deltaDeg)&&Math.abs(deltaDeg)<0.6)return rec;
    prevDelta=deltaDeg;
  }
  return best&&best.deltaDeg<=0.35?best:undefined;
}

export interface ViewshedSegment{from:GeoPoint;to:GeoPoint;visible:boolean;bearingDeg:number;distanceM:number;elevationM?:number}
export function computeViewshedSegments(tower:Tower,samples:TerrainSample[],maxRangeM=30000,bearingStepDeg=10,rangeSteps=10):ViewshedSegment[]{
  if(!samples.length)return[];const out:ViewshedSegment[]=[];const observer=tower.elevationM+2;
  for(let b=0;b<360;b+=bearingStepDeg){let maxAngle=-90;let prev:GeoPoint={lat:tower.lat,lon:tower.lon};
    for(let i=1;i<=rangeSteps;i++){
      const d=maxRangeM*i/rangeSteps;const p=destinationPoint(tower.lat,tower.lon,b,d);const z=sampleElevation(samples,p);
      let visible=false;if(z!=null){const a=apparentAngleDeg(observer,z,d);visible=a>=maxAngle-0.03;if(a>maxAngle)maxAngle=a}
      out.push({from:prev,to:p,visible,bearingDeg:b,distanceM:d,elevationM:z});prev=p;
    }
  }
  return out;
}

export function horizonProfile(tower:Tower,samples:TerrainSample[],maxRangeM=40000,bearingStepDeg=5){
  const result:{bearingDeg:number;maxAngleDeg:number;distanceM:number;elevationM?:number}[]=[];
  for(let b=0;b<360;b+=bearingStepDeg){let maxAngle=-90,bestD=0,bestZ:number|undefined;for(let d=500;d<=maxRangeM;d+=500){const p=destinationPoint(tower.lat,tower.lon,b,d);const z=sampleElevation(samples,p);if(z==null)continue;const a=apparentAngleDeg(tower.elevationM+2,z,d);if(a>maxAngle){maxAngle=a;bestD=d;bestZ=z}}result.push({bearingDeg:b,maxAngleDeg:maxAngle,distanceM:bestD,elevationM:bestZ})}
  return result;
}
