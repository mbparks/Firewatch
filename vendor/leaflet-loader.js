/* FIREWATCH Leaflet 1.9.4 offline-prepared loader.
   The application is no-build. This helper stores the upstream Leaflet browser
   distribution in Cache Storage after a connected preparation/first load, then
   evaluates the cached copy on later disconnected starts. */
(function(){
'use strict';
const VERSION='1.9.4';
const LOCAL='./vendor/leaflet.js';
const URL='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const CACHE='firewatch-map-engine-v1';
const STORAGE='firewatch.leaflet.1.9.4';
function announce(ok,source,error){
  window.FIREWATCH_LEAFLET_STATUS={ok,source,version:window.L&&window.L.version||null,error:error?String(error):null};
  window.dispatchEvent(new CustomEvent('leafletready',{detail:window.FIREWATCH_LEAFLET_STATUS}));
}
function execute(text,source){
  if(!text||text.length<10000)throw new Error('Leaflet payload is incomplete.');
  (0,eval)(text+'\n//# sourceURL=firewatch-leaflet-1.9.4.js');
  if(!window.L||window.L.version!=='1.9.4')throw new Error('Leaflet 1.9.4 did not initialize.');
  announce(true,source);
  return true;
}
async function localFile(){
  try{const r=await fetch(LOCAL,{cache:'no-store'});if(!r.ok)return false;return execute(await r.text(),'LOCAL VENDOR FILE')}catch{return false}
}
async function cached(){
  try{const text=localStorage.getItem(STORAGE);if(text)return execute(text,'LOCAL STORAGE CACHE')}catch{}
  if(!('caches' in window))return false;
  const c=await caches.open(CACHE),r=await c.match(URL);
  if(!r)return false;
  return execute(await r.text(),'CACHE STORAGE');
}
async function network(force=false){
  const r=await fetch(URL,{mode:'cors',cache:force?'reload':'default'});
  if(!r.ok)throw new Error('Leaflet download HTTP '+r.status);
  const text=await r.clone().text();
  try{localStorage.setItem(STORAGE,text)}catch{}
  if('caches' in window){const c=await caches.open(CACHE);await c.put(URL,new Response(text,{headers:{'Content-Type':'application/javascript'}}));}
  return execute(text,'NETWORK → CACHE');
}
async function prepare(){
  try{return await network(true)}catch(e){announce(false,'PREPARE FAILED',e);throw e}
}
window.FirewatchLeafletLoader={version:VERSION,url:URL,local:LOCAL,cacheName:CACHE,storageKey:STORAGE,prepare,status:()=>window.FIREWATCH_LEAFLET_STATUS||{ok:false,source:'PENDING'}};
(async()=>{
  if(window.L){announce(true,'PRELOADED');return}
  try{if(await localFile())return}catch(e){console.warn('Local Leaflet vendor failed',e)}
  try{if(await cached())return}catch(e){console.warn('Cached Leaflet failed',e)}
  try{await network(false)}catch(e){console.warn('Leaflet unavailable; FIREWATCH continues without map engine.',e);announce(false,'UNAVAILABLE',e)}
})();
})();
