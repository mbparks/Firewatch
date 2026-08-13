import { db } from '../storage/db';
import type { DataFreshness, WeatherObservation, WeatherSourceConfig } from '../types';
import { makeId } from '../utils/ids';

const n=(v:unknown):number|undefined=>{const x=typeof v==='string'?Number(v):v;return typeof x==='number'&&Number.isFinite(x)?x:undefined};
const s=(v:unknown):string|undefined=>typeof v==='string'&&v.trim()?v.trim():undefined;
const first=(o:any,keys:string[])=>{for(const k of keys)if(o?.[k]!=null)return o[k];return undefined};

export function weatherFreshness(wx?:WeatherObservation, now=Date.now()):DataFreshness{
  if(!wx)return 'UNAVAILABLE';
  const age=(now-new Date(wx.timestamp).getTime())/60000;
  const stale=wx.staleAfterMinutes??60;
  if(age<=Math.min(5,stale/2))return 'LIVE';
  if(age<=stale)return 'CACHED';
  return 'STALE';
}

export function normalizeWeatherPayload(payload:any, source:WeatherSourceConfig):WeatherObservation{
  const root=payload?.weather??payload?.current??payload;
  const temperatureF=n(first(root,['temperatureF','tempF','temperature_f','temperature']));
  const temperatureC=n(first(root,['temperatureC','tempC','temperature_c']));
  const windMph=n(first(root,['windMph','wind_mph','windSpeedMph']));
  const windKph=n(first(root,['windKph','wind_kph','windSpeedKph']));
  const gustMph=n(first(root,['gustMph','gust_mph','windGustMph']));
  const gustKph=n(first(root,['gustKph','gust_kph','windGustKph']));
  const pressureInHg=n(first(root,['pressureInHg','pressure_inhg']));
  const pressureHpa=n(first(root,['pressureHpa','pressure_hpa','pressure']));
  const precipIn=n(first(root,['precipIn','precip_in']));
  const precipMm=n(first(root,['precipMm','precip_mm','precipitationMm']));
  const visibilityMi=n(first(root,['visibilityMi','visibility_mi']));
  const visibilityKm=n(first(root,['visibilityKm','visibility_km']));
  const timestampRaw=first(root,['timestamp','time','observedAt','datetime']);
  const timestamp=timestampRaw && !Number.isNaN(Date.parse(String(timestampRaw)))?new Date(String(timestampRaw)).toISOString():new Date().toISOString();
  return {
    id:makeId('wx'), timestamp,
    temperatureF:temperatureF??(temperatureC!=null?temperatureC*9/5+32:undefined),
    rh:n(first(root,['rh','humidity','relativeHumidity','relative_humidity'])),
    windDir:s(first(root,['windDir','wind_dir','windDirection','wind_direction'])),
    windMph:windMph??(windKph!=null?windKph*0.621371:undefined),
    gustMph:gustMph??(gustKph!=null?gustKph*0.621371:undefined),
    pressureInHg:pressureInHg??(pressureHpa!=null?pressureHpa*0.0295299831:undefined),
    precipIn:precipIn??(precipMm!=null?precipMm/25.4:undefined),
    visibilityMi:visibilityMi??(visibilityKm!=null?visibilityKm*0.621371:undefined),
    cloudCover:s(first(root,['cloudCover','cloud_cover','clouds'])),
    source:source.kind==='LOCAL SENSOR'?'TOWER SENSOR':'REMOTE STATION',
    sourceName:source.name, receivedAt:new Date().toISOString(), stationId:s(first(root,['stationId','station_id','station'])), staleAfterMinutes:source.staleAfterMinutes,
    notes:s(first(root,['notes','condition','conditions']))
  };
}

export async function pollWeatherSource(source:WeatherSourceConfig){
  const attempt=new Date().toISOString();
  await db.weatherSources.update(source.id,{lastAttemptAt:attempt});
  const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),8000);
  try{
    const res=await fetch(source.url,{cache:'no-store',signal:ctrl.signal,headers:{Accept:'application/json'}});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const payload=await res.json();const wx=normalizeWeatherPayload(payload,source);
    await db.transaction('rw',[db.weather,db.weatherSources,db.shiftLogs],async()=>{
      await db.weather.add(wx);
      await db.weatherSources.update(source.id,{lastSuccessAt:new Date().toISOString(),lastError:undefined});
      await db.shiftLogs.add({id:makeId('log'),timestamp:new Date().toISOString(),kind:'WEATHER',message:`Weather updated from ${source.name}`});
    });
    return wx;
  }catch(err){const message=err instanceof Error?err.message:String(err);await db.weatherSources.update(source.id,{lastError:message});throw err}finally{clearTimeout(timer)}
}

export function formatWeatherLine(wx?:WeatherObservation){
  if(!wx)return 'No weather observation';
  const bits=[wx.temperatureF!=null?`${Math.round(wx.temperatureF)}°F`:null,wx.rh!=null?`RH ${Math.round(wx.rh)}%`:null,wx.windDir&&wx.windMph!=null?`${wx.windDir} ${Math.round(wx.windMph)} mph`:null,wx.gustMph!=null?`G${Math.round(wx.gustMph)}`:null,wx.visibilityMi!=null?`VIS ${Math.round(wx.visibilityMi)} mi`:null];
  return bits.filter(Boolean).join(' · ');
}
