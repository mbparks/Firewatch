import type { AppSettings, SyncStatusRecord } from '../types';
import { db } from '../storage/db';
import { applySyncEvents, collectSyncRecords, getSyncStatus, type SyncEvent } from './replication';

function base(url:string){return url.replace(/\/$/,'')}
export async function syncNow(settings:AppSettings):Promise<SyncStatusRecord>{
  const before=await getSyncStatus(),attempt=new Date().toISOString();
  await db.syncStatus.put({...before,lastAttemptAt:attempt});
  try{
    const records=await collectSyncRecords(settings);
    const push=await fetch(`${base(settings.syncServerUrl)}/sync/push`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({stationId:settings.stationId,stationRole:settings.stationRole,records})});
    if(!push.ok)throw new Error(`push HTTP ${push.status}`);const pushed=await push.json();
    const pull=await fetch(`${base(settings.syncServerUrl)}/sync/pull?stationId=${encodeURIComponent(settings.stationId)}&cursor=${before.cursor||0}`);
    if(!pull.ok)throw new Error(`pull HTTP ${pull.status}`);const data=await pull.json() as {events:SyncEvent[];nextCursor:number};
    await applySyncEvents(data.events||[],settings.stationId);
    const next:SyncStatusRecord={id:'sync',cursor:data.nextCursor??before.cursor,lastAttemptAt:attempt,lastSuccessAt:new Date().toISOString(),pushedRecords:Number(pushed.accepted||0),pulledRecords:(data.events||[]).length,consecutiveFailures:0};
    await db.syncStatus.put(next);return next;
  }catch(err){const next={...before,lastAttemptAt:attempt,lastError:err instanceof Error?err.message:String(err),consecutiveFailures:(before.consecutiveFailures||0)+1};await db.syncStatus.put(next);throw err;}
}

export async function pingSync(url:string){const r=await fetch(`${base(url)}/health`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}
