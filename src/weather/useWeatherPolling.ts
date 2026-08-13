import { useEffect } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../storage/db';
import type { AppSettings, WeatherSourceConfig } from '../types';
import { pollWeatherSource } from './weather';

export function useWeatherPolling(settings?:AppSettings|null){
  useEffect(()=>{
    if(!settings?.weatherAutoPoll)return;
    let sources:WeatherSourceConfig[]=[];let stopped=false;const running=new Set<string>();
    const sub=liveQuery(()=>db.weatherSources.toArray()).subscribe({next:v=>sources=v.filter(x=>x.enabled)});
    const tick=async()=>{if(stopped)return;const now=Date.now();for(const src of sources){if(src.kind==='REMOTE JSON'&&!navigator.onLine)continue;const last=src.lastAttemptAt?new Date(src.lastAttemptAt).getTime():0;if(now-last<src.pollMinutes*60000)continue;if(running.has(src.id))continue;running.add(src.id);pollWeatherSource(src).catch(()=>{}).finally(()=>running.delete(src.id))}};
    const timer=window.setInterval(tick,30000);tick();
    return()=>{stopped=true;sub.unsubscribe();window.clearInterval(timer)};
  },[settings?.weatherAutoPoll]);
}
