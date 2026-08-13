import { useEffect, useRef } from 'react';
import type { AppSettings } from '../types';
import { syncNow } from './client';

export function useSync(settings:AppSettings|null|undefined){
  const busy=useRef(false);
  useEffect(()=>{
    if(!settings?.syncEnabled)return;
    let stopped=false;
    const run=async()=>{if(stopped||busy.current||!navigator.onLine)return;busy.current=true;try{await syncNow(settings)}catch{}finally{busy.current=false}};
    run();const id=window.setInterval(run,settings.syncIntervalSeconds*1000);return()=>{stopped=true;window.clearInterval(id)};
  },[settings?.syncEnabled,settings?.syncServerUrl,settings?.syncIntervalSeconds,settings?.stationId,settings?.stationRole,settings?.sharePresence]);
}
