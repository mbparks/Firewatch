import type { TerrainSample } from '../types';
import { makeId } from '../utils/ids';

export function parseTerrainData(text:string,name:string):TerrainSample[]{
  if(name.toLowerCase().endsWith('.asc')||/^ncols\s+/i.test(text.trim())){
    const lines=text.trim().split(/\r?\n/);const meta:Record<string,number>={};let i=0;
    for(;i<Math.min(10,lines.length);i++){const m=lines[i].trim().match(/^(ncols|nrows|xllcorner|yllcorner|xllcenter|yllcenter|cellsize|nodata_value)\s+(-?\d+(?:\.\d+)?)/i);if(!m)break;meta[m[1].toLowerCase()]=Number(m[2])}
    const ncols=meta.ncols,nrows=meta.nrows,cell=meta.cellsize,x0=meta.xllcorner??meta.xllcenter,y0=meta.yllcorner??meta.yllcenter,nodata=meta.nodata_value??-9999;
    if(!ncols||!nrows||!cell||!Number.isFinite(x0)||!Number.isFinite(y0))throw new Error('Invalid ESRI ASCII grid header');
    const stride=Math.max(1,Math.ceil(Math.sqrt((ncols*nrows)/20000)));const out:TerrainSample[]=[];
    for(let r=0;r<nrows;r+=stride){const vals=lines[i+r]?.trim().split(/\s+/).map(Number)||[];for(let c=0;c<ncols;c+=stride){const z=vals[c];if(!Number.isFinite(z)||z===nodata)continue;out.push({id:makeId('dem'),lat:y0+(nrows-r-.5)*cell,lon:x0+(c+.5)*cell,elevationM:z,source:'ASCII GRID'})}}
    return out;
  }
  if(name.toLowerCase().endsWith('.geojson')||text.trim().startsWith('{')){
    const g=JSON.parse(text),fs=g.type==='FeatureCollection'?g.features:[g];
    return fs.map((f:any)=>{const c=f.geometry?.coordinates,z=Number(f.properties?.elevationM??f.properties?.elevation??f.properties?.ele??c?.[2]);return{id:makeId('dem'),lat:Number(c?.[1]),lon:Number(c?.[0]),elevationM:z,source:'GEOJSON' as const}}).filter((x:any)=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&Number.isFinite(x.elevationM));
  }
  const lines=text.trim().split(/\r?\n/).filter(Boolean);if(lines.length<2)return[];const h=lines[0].split(',').map(x=>x.trim().toLowerCase());const fi=(...n:string[])=>h.findIndex(x=>n.includes(x));const a=fi('lat','latitude'),o=fi('lon','lng','longitude'),z=fi('elevation','elevationm','ele','z');if(a<0||o<0||z<0)throw new Error('Terrain CSV needs lat, lon, elevation columns');
  return lines.slice(1).map(l=>{const c=l.split(',');return{id:makeId('dem'),lat:Number(c[a]),lon:Number(c[o]),elevationM:Number(c[z]),source:'CSV' as const}}).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&Number.isFinite(x.elevationM));
}
