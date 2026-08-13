/* FIREWATCH Leaflet 1.9.4 runtime loader — v1.5.1 map startup fix.
   No dynamic evaluation. No package manager. Tries a local vendored copy first, then
   several normal <script src> CDN sources. Emits a single leafletready event
   when loading succeeds or all sources fail. */
(function(){
'use strict';
const VERSION='1.9.4';
const SOURCES=[
  {label:'LOCAL VENDOR',src:'./vendor/leaflet.js'},
  {label:'UNPKG',src:'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'},
  {label:'JSDELIVR',src:'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'},
  {label:'CDNJS',src:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'}
];
let settled=false;
let resolveReady;
const ready=new Promise(resolve=>{resolveReady=resolve});
function status(ok,source,error){
  const detail={ok,source,version:window.L&&window.L.version||null,error:error?String(error):null};
  window.FIREWATCH_LEAFLET_STATUS=detail;
  if(!settled){
    settled=true;
    resolveReady(detail);
    window.dispatchEvent(new CustomEvent('leafletready',{detail}));
  }
  return detail;
}
function loadSource(item,timeoutMs){
  return new Promise((resolve,reject)=>{
    if(window.L&&window.L.version){resolve(item.label);return}
    const s=document.createElement('script');
    let done=false;
    const finish=(ok,err)=>{
      if(done)return;
      done=true;
      clearTimeout(timer);
      s.onload=s.onerror=null;
      if(ok&&window.L&&window.L.version==='1.9.4')resolve(item.label);
      else reject(err||new Error(item.label+' loaded but Leaflet 1.9.4 did not initialize'));
    };
    const timer=setTimeout(()=>finish(false,new Error(item.label+' timed out')),timeoutMs);
    s.src=item.src;
    s.async=true;
    s.crossOrigin='anonymous';
    s.dataset.firewatchLeaflet=item.label;
    s.onload=()=>finish(true);
    s.onerror=()=>finish(false,new Error(item.label+' failed to load'));
    document.head.appendChild(s);
  });
}
async function attempt(forceNetwork=false){
  if(window.L&&window.L.version==='1.9.4')return status(true,'PRELOADED');
  settled=false;
  const errors=[];
  const list=forceNetwork?SOURCES.slice(1):SOURCES;
  for(const item of list){
    try{
      const source=await loadSource(item,item.label==='LOCAL VENDOR'?1200:8000);
      return status(true,source);
    }catch(err){
      errors.push(err.message||String(err));
      console.warn('FIREWATCH Leaflet source failed:',item.label,err);
    }
  }
  return status(false,'UNAVAILABLE',errors.join(' | '));
}
async function prepare(){
  /* In v1.5.1 PREPARE means verify a connected network source can initialize.
     For first-ever offline use, deploy the official Leaflet distribution at
     vendor/leaflet.js; no eval/cache execution is used. */
  if(window.L&&window.L.version==='1.9.4')return status(true,'ALREADY READY');
  return attempt(true);
}
window.FirewatchLeafletLoader={
  version:VERSION,
  sources:SOURCES.map(x=>x.src),
  local:SOURCES[0].src,
  ready,
  prepare,
  retry:()=>attempt(false),
  status:()=>window.FIREWATCH_LEAFLET_STATUS||{ok:false,source:'LOADING',version:null,error:null}
};
window.FIREWATCH_LEAFLET_STATUS={ok:false,source:'LOADING',version:null,error:null};
attempt(false);
})();
